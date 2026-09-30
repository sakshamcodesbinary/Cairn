import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type EnvironmentConfiguration, waitForFunds } from '@midnight-ntwrk/testkit-js';
import pino from 'pino';
import { getConfig } from '../config.js';
import { MidnightWalletProvider, syncWallet, type WalletSecret } from '../wallet.js';
import { buildProviders, type CairnProviders } from '../providers.js';
import { CompiledCairnContract, Contract, ledger, pureCircuits, zkConfigPath, type CairnPrivateState } from '../../contracts/index.js';

// Explicit opt-in only: this suite submits real transactions and requires services.
if (process.env['CAIRN_INTEGRATION'] !== '1') throw new Error('Use npm run test:integration to opt in.');
Object.assign(globalThis, { WebSocket });
const PRIVATE_STATE_ID = 'CairnIntegrationState';
const logger = pino({ level: process.env['LOG_LEVEL'] ?? 'info', transport: { target: 'pino-pretty' } });
const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';

function resolveSecret(): WalletSecret {
  // Public development-chain seed only. Never used on preview/preprod.
  if (network === 'local') return { kind: 'seed', value: '0'.repeat(63) + '1' };
  const upper = network.toUpperCase();
  const mnemonic = process.env[`MIDNIGHT_${upper}_MNEMONIC`]?.trim().replace(/\s+/g, ' ');
  const seed = process.env[`MIDNIGHT_${upper}_SEED`]?.trim();
  if (mnemonic && seed) throw new Error('Set only one wallet secret.');
  if (mnemonic) return { kind: 'mnemonic', value: mnemonic };
  if (seed) return { kind: 'seed', value: seed };
  throw new Error(`Set MIDNIGHT_${upper}_MNEMONIC or MIDNIGHT_${upper}_SEED.`);
}

describe.sequential(`Cairn gate (${network})`, () => {
  let wallet: MidnightWalletProvider | undefined;
  let providers: CairnProviders;
  let contractAddress: ContractAddress;
  const config = getConfig();
  const environment: EnvironmentConfiguration = { walletNetworkId: config.networkId, ...config };
  const state: CairnPrivateState = {
    memberSecret: new Uint8Array(32).fill(3), memberClearance: 3n, adminSecret: new Uint8Array(32).fill(7),
  };
  const gateName = new Uint8Array(32);
  gateName.set(new TextEncoder().encode('Cairn integration'));

  async function readLedger() {
    const publicState = await providers.publicDataProvider.queryContractState(contractAddress);
    expect(publicState).not.toBeNull();
    return ledger(publicState!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId);
    wallet = await MidnightWalletProvider.build(logger, environment, resolveSecret());
    await wallet.start();
    await syncWallet(logger, wallet.wallet, network === 'local' ? 10 * 60_000 : 60 * 60_000);
    if (config.faucet) await waitForFunds(wallet.wallet, environment, true, wallet.unshieldedKeystore);
    providers = buildProviders(wallet, zkConfigPath, config);
  });
  afterAll(async () => { await wallet?.stop(); });

  it('deploys using the five public constructor arguments', async () => {
    const deployed = await deployContract<Contract<CairnPrivateState>>(providers, {
      compiledContract: CompiledCairnContract, privateStateId: PRIVATE_STATE_ID, initialPrivateState: state,
      args: [gateName, pureCircuits.derive_member_key(state.memberSecret, state.memberClearance), 2n, 250n, pureCircuits.derive_admin_key(state.adminSecret)],
    });
    contractAddress = deployed.deployTxData.public.contractAddress;
    expect(contractAddress).toBeDefined();
    const publicState = await readLedger();
    expect(publicState.gate_name).toEqual(gateName);
    expect(publicState.verified_entries).toBe(0n);
  });

  it('uses private witnesses to prove access with only a badge argument', async () => {
    const badge = new Uint8Array(32).fill(55);
    await submitCallTx<Contract<CairnPrivateState>, 'prove_access'>(providers, {
      compiledContract: CompiledCairnContract, contractAddress, privateStateId: PRIVATE_STATE_ID,
      circuitId: 'prove_access', args: [badge],
    });
    const publicState = await readLedger();
    expect(publicState.verified_entries).toBe(1n);
    expect(publicState.badge_registry.member(badge)).toBe(true);
    expect(Object.keys(publicState)).not.toContain('member_secret');
    expect(Object.keys(publicState)).not.toContain('member_clearance');
  });

  it('rejects replay through the real call pipeline', async () => {
    await expect(submitCallTx<Contract<CairnPrivateState>, 'prove_access'>(providers, {
      compiledContract: CompiledCairnContract, contractAddress, privateStateId: PRIVATE_STATE_ID,
      circuitId: 'prove_access', args: [new Uint8Array(32).fill(56)],
    })).rejects.toThrow();
  });

  it('pauses with the private administrator witness', async () => {
    await submitCallTx<Contract<CairnPrivateState>, 'set_gate_open'>(providers, {
      compiledContract: CompiledCairnContract, contractAddress, privateStateId: PRIVATE_STATE_ID,
      circuitId: 'set_gate_open', args: [false],
    });
    expect((await readLedger()).is_open).toBe(false);
  });
});
