import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenDeployTx, createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { ContractState, type SigningKey, type WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits, type Ledger, type Witnesses } from '../managed/contract/index.js';
import { cleanContractAddress, isValidContractAddress, NETWORKS, type MidnightNetwork } from '../config';
import { assertSessionNetwork, fromHex, indexerQuery, wipePrivateState, type ConnectedSession } from './midnight';

export type CairnPrivateState = { memberSecret: Uint8Array; memberClearance: bigint; adminSecret: Uint8Array };
export const emptyPrivateState = (): CairnPrivateState => ({ memberSecret: new Uint8Array(32), memberClearance: 0n, adminSecret: new Uint8Array(32) });
export const witnesses: Witnesses<CairnPrivateState> = {
  member_secret: ({ privateState }: WitnessContext<Ledger, CairnPrivateState>): [CairnPrivateState, Uint8Array] => [privateState, privateState.memberSecret],
  member_clearance: ({ privateState }: WitnessContext<Ledger, CairnPrivateState>): [CairnPrivateState, bigint] => [privateState, privateState.memberClearance],
  admin_secret: ({ privateState }: WitnessContext<Ledger, CairnPrivateState>): [CairnPrivateState, Uint8Array] => [privateState, privateState.adminSecret],
};
export function getCompiledContract() {
  return CompiledContract.make('Cairn', Contract<CairnPrivateState>).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(new URL('/managed', window.location.origin).toString()),
  );
}
export { pureCircuits };
export type { Ledger };
export function parseInteger(value: string, label: string, min: bigint, max: bigint): bigint {
  if (!/^\d+$/.test(value)) throw new Error(`${label} must be a whole number.`);
  const number = BigInt(value);
  if (number < min || number > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return number;
}
export function validateAddress(value: string): string {
  if (!isValidContractAddress(value)) throw new Error('Enter a 64-character hexadecimal contract address.');
  return cleanContractAddress(value);
}
export async function readGate(address: string, network: MidnightNetwork, signal?: AbortSignal): Promise<Ledger> {
  const data = await indexerQuery<{ contractAction: { state: string } | null }>(NETWORKS[network].indexerUrl,
    'query Gate($address: HexEncoded!) { contractAction(address: $address) { state } }', { address: validateAddress(address) }, signal);
  if (!data.contractAction) throw new Error(`No indexed contract at this address on ${network}. Check the network or wait for indexing.`);
  try { return ledger(ContractState.deserialize(fromHex(data.contractAction.state)).data); }
  catch { throw new Error('This contract state is not compatible with the current Cairn contract.'); }
}
export const CIRCUITS = ['prove_access', 'update_gate', 'set_gate_open'] as const;
export type Circuit = typeof CIRCUITS[number];
export async function checkContractAssets(session: ConnectedSession, circuits: readonly Circuit[] = CIRCUITS): Promise<void> {
  // Fetch the real binary artifacts. The provider rejects missing files and HTML SPA fallbacks.
  await Promise.all(circuits.map(async (circuit) => {
    const provider = session.providers.zkConfigProvider;
    const artifacts = await Promise.all([provider.getProverKey(circuit), provider.getVerifierKey(circuit), provider.getZKIR(circuit)]);
    if (artifacts.some((asset) => asset.byteLength === 0)) throw new Error(`Empty proving artifact for ${circuit}. Rebuild and publish contract assets.`);
  }));
}
export type DeployGateOptions = {
  name: Uint8Array; root: Uint8Array; minimum: bigint; maximum: bigint; adminKey: Uint8Array; signingKey: SigningKey;
};
export async function deployGate(session: ConnectedSession, network: MidnightNetwork, options: DeployGateOptions): Promise<{ address: string; txId: string }> {
  await assertSessionNetwork(session, network);
  await checkContractAssets(session);
  await assertSessionNetwork(session, network);
  const tx = await createUnprovenDeployTx(session.providers, {
    compiledContract: getCompiledContract(), args: [options.name, options.root, options.minimum, options.maximum, options.adminKey],
    initialPrivateState: emptyPrivateState(), signingKey: options.signingKey,
  });
  const txId = await submitTxAsync(session.providers, { unprovenTx: tx.private.unprovenTx });
  return { address: cleanContractAddress(tx.public.contractAddress), txId };
}
type Call = { circuit: 'prove_access'; args: [Uint8Array] } | { circuit: 'update_gate'; args: [Uint8Array, bigint, bigint] } | { circuit: 'set_gate_open'; args: [boolean] };
export async function callGate(session: ConnectedSession, network: MidnightNetwork, address: string, state: CairnPrivateState, call: Call): Promise<string> {
  const store = session.providers.privateStateProvider;
  const id = `cairn:${crypto.randomUUID()}`;
  try {
    await assertSessionNetwork(session, network);
    await checkContractAssets(session, [call.circuit]);
    await assertSessionNetwork(session, network);
    store.setContractAddress(validateAddress(address));
    await store.set(id, state);
    const common = { compiledContract: getCompiledContract(), contractAddress: validateAddress(address), privateStateId: id };
    // Keep each circuit's public arguments separate; secrets enter only through witnesses.
    const tx = call.circuit === 'prove_access'
      ? await createUnprovenCallTx(session.providers, { ...common, circuitId: 'prove_access', args: call.args })
      : call.circuit === 'update_gate'
        ? await createUnprovenCallTx(session.providers, { ...common, circuitId: 'update_gate', args: call.args })
        : await createUnprovenCallTx(session.providers, { ...common, circuitId: 'set_gate_open', args: call.args });
    return await submitTxAsync(session.providers, { unprovenTx: tx.private.unprovenTx, circuitId: call.circuit });
  } finally {
    wipePrivateState(state);
    // Use the original scope even if a disconnected session has cleared the store.
    store.setContractAddress(cleanContractAddress(address));
    await store.remove(id);
  }
}
export type IndexedReceipt = { txId: string; txHash: string; blockHeight: number; indexedAt: string };
export async function waitForConfirmation(queryUrl: string, txId: string, signal?: AbortSignal): Promise<IndexedReceipt> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    const data = await indexerQuery<{ transactions: { hash: string; block: { height: number }; transactionResult?: { status: string } }[] }>(queryUrl,
      'query Receipt($offset: TransactionOffset!) { transactions(offset: $offset) { hash block { height } ... on RegularTransaction { transactionResult { status } } } }',
      { offset: { identifier: txId } }, signal);
    const tx = data.transactions[0];
    if (tx) {
      if (tx.transactionResult?.status !== 'SUCCESS') throw new Error(`Transaction was indexed but did not succeed (${tx.transactionResult?.status ?? 'unknown status'}).`);
      return { txId, txHash: tx.hash, blockHeight: tx.block.height, indexedAt: new Date().toISOString() };
    }
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new DOMException('Confirmation cancelled', 'AbortError')); };
      const timer = window.setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, 3000);
      signal?.addEventListener('abort', abort, { once: true });
    });
  }
  throw new Error('Submitted, but confirmation was not observed within two minutes. Do not resubmit blindly; check the explorer or retry confirmation.');
}
export function downloadJson(filename: string, value: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
