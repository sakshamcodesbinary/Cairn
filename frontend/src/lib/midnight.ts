import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ContractState, type SigningKey } from '@midnight-ntwrk/compact-runtime';
import { CostModel, Transaction } from '@midnight-ntwrk/ledger-v8';
import { MidnightBech32m, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProvider, WalletProvider, ProofProvider, PublicDataProvider, PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import { getSelectedNetwork, type MidnightNetwork } from '../config';
import type { CairnPrivateState, Circuit } from './contract';

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export function fromHex(hex: string): Uint8Array {
  const normalized = hex.replace(/^0x/i, '');
  if (!normalized.length || normalized.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(normalized)) throw new Error('Invalid hexadecimal payload.');
  return Uint8Array.from(normalized.match(/../g)!, (byte) => Number.parseInt(byte, 16));
}
export function wipePrivateState(state: CairnPrivateState): void {
  state.memberSecret.fill(0);
  state.adminSecret.fill(0);
  state.memberClearance = 0n;
}
export function createPrivateStateProvider(): PrivateStateProvider<string, CairnPrivateState> {
  let scope = '';
  const states = new Map<string, CairnPrivateState>();
  const signingKeys = new Map<string, SigningKey>();
  const key = (id: string) => { if (!scope) throw new Error('Private state requires a contract scope.'); return `${scope}:${id}`; };
  return {
    setContractAddress(address) { scope = address; },
    async set(id, state) { const previous = states.get(key(id)); if (previous && previous !== state) wipePrivateState(previous); states.set(key(id), state); },
    async get(id) { return states.get(key(id)) ?? null; },
    async remove(id) { const state = states.get(key(id)); if (state) wipePrivateState(state); states.delete(key(id)); },
    async clear() { states.forEach(wipePrivateState); states.clear(); },
    async setSigningKey(address, value) { signingKeys.set(address, value); },
    async getSigningKey(address) { return signingKeys.get(address) ?? null; },
    async removeSigningKey(address) { signingKeys.delete(address); },
    async clearSigningKeys() { signingKeys.clear(); },
    async exportPrivateStates(): Promise<never> { throw new Error('Session-only private state cannot be exported.'); },
    async importPrivateStates(): Promise<never> { throw new Error('Session-only private state cannot be imported.'); },
    async exportSigningKeys(): Promise<never> { throw new Error('Session-only signing keys cannot be exported.'); },
    async importSigningKeys(): Promise<never> { throw new Error('Session-only signing keys cannot be imported.'); },
  };
}
export async function indexerQuery<T>(queryUrl: string, query: string, variables: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(queryUrl, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Indexer request failed (HTTP ${response.status}).`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors.map((error: { message: string }) => error.message).join('; '));
  if (!payload.data) throw new Error('Indexer returned no data.');
  return payload.data as T;
}
export function createPatchedPublicDataProvider(queryUrl: string, subscriptionUrl: string): PublicDataProvider {
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);
  return {
    ...base,
    async queryContractState(address, config) {
      if (config) return base.queryContractState(address, config);
      const data = await indexerQuery<{ contractAction: { state: string } | null }>(queryUrl,
        'query Latest($address: HexEncoded!) { contractAction(address: $address) { state } }', { address });
      return data.contractAction ? ContractState.deserialize(fromHex(data.contractAction.state)) : null;
    },
  };
}
export type ConnectedSession = {
  api: ConnectedAPI;
  config: Awaited<ReturnType<ConnectedAPI['getConfiguration']>>;
  network: MidnightNetwork;
  unshieldedAddress: string;
  providers: {
    privateStateProvider: PrivateStateProvider<string, CairnPrivateState>;
    publicDataProvider: PublicDataProvider;
    zkConfigProvider: FetchZkConfigProvider<Circuit>;
    proofProvider: ProofProvider;
    walletProvider: WalletProvider;
    midnightProvider: MidnightProvider;
  };
  dispose: () => void;
  assertActive: () => void;
};
export async function assertSessionNetwork(session: ConnectedSession, network: MidnightNetwork): Promise<void> {
  session.assertActive();
  const config = await session.api.getConfiguration();
  if (session.network !== network || config.networkId !== network || getSelectedNetwork() !== network) {
    throw new Error(`Network mismatch. Select ${network} in both Cairn and your wallet, then reconnect.`);
  }
}
export async function createConnectedSession(api: ConnectedAPI, network: MidnightNetwork): Promise<ConnectedSession> {
  // Validate BEFORE changing the SDK's global network.
  const config = await api.getConfiguration();
  if (config.networkId !== network) throw new Error(`Wallet is on ${config.networkId}; Cairn requested ${network}. Switch your wallet network and reconnect.`);
  if (getSelectedNetwork() !== network) throw new Error('Network selection changed while connecting. Please reconnect.');
  if (typeof api.getProvingProvider !== 'function') throw new Error('This wallet connector is outdated. Update it to support wallet-delegated proving.');
  const [unshielded, shielded] = await Promise.all([api.getUnshieldedAddress(), api.getShieldedAddresses()]);
  const decodeKey = (value: string, kind: 'coin' | 'encryption') => {
    if (/^[0-9a-f]{64}$/i.test(value)) return value.toLowerCase();
    const codec = kind === 'coin' ? ShieldedCoinPublicKey.codec : ShieldedEncryptionPublicKey.codec;
    return codec.decode(network, MidnightBech32m.parse(value)).toHexString();
  };
  const coinKey = decodeKey(shielded.shieldedCoinPublicKey, 'coin');
  const encryptionKey = decodeKey(shielded.shieldedEncryptionPublicKey, 'encryption');
  if (!unshielded.unshieldedAddress) throw new Error('Wallet returned no unshielded address.');
  if (getSelectedNetwork() !== network) throw new Error('Network selection changed while connecting. Please reconnect.');
  setNetworkId(network);
  const zkConfigProvider = new FetchZkConfigProvider<Circuit>(new URL('/managed', window.location.origin).toString(), window.fetch.bind(window));
  const provingProvider = await api.getProvingProvider(zkConfigProvider);
  const privateStateProvider = createPrivateStateProvider();
  let active = true;
  const assertActive = () => { if (!active || getSelectedNetwork() !== network) throw new Error('Wallet session ended or network changed. Reconnect before continuing.'); };
  const guard = async () => { assertActive(); if ((await api.getConfiguration()).networkId !== network) throw new Error('Wallet network changed. Reconnect before continuing.'); assertActive(); };
  const proofProvider: ProofProvider = {
    async proveTx(transaction) { await guard(); return transaction.prove(provingProvider, CostModel.initialCostModel()); },
  };
  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => coinKey,
    getEncryptionPublicKey: () => encryptionKey,
    async balanceTx(transaction) {
      await guard();
      const balanced = await api.balanceUnsealedTransaction(toHex(transaction.serialize()));
      if (!balanced?.tx) throw new Error('Wallet did not return a balanced transaction.');
      return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
    },
  };
  const midnightProvider: MidnightProvider = {
    async submitTx(transaction) {
      await guard();
      // Connector 4.x returns void. The ledger transaction supplies the genuine ID.
      const txId = transaction.identifiers()[0];
      if (!txId) throw new Error('Balanced transaction has no transaction identifier.');
      await api.submitTransaction(toHex(transaction.serialize()));
      return txId;
    },
  };
  return {
    api, config, network, unshieldedAddress: unshielded.unshieldedAddress, assertActive,
    providers: { privateStateProvider, publicDataProvider: createPatchedPublicDataProvider(config.indexerUri, config.indexerWsUri), zkConfigProvider, proofProvider, walletProvider, midnightProvider },
    dispose() { active = false; void privateStateProvider.clear(); void privateStateProvider.clearSigningKeys(); },
  };
}
