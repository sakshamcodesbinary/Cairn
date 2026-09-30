import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProvider } from '@midnight-ntwrk/midnight-js-types';
const mocks = vi.hoisted(() => ({ setNetworkId: vi.fn() }));
vi.mock('@midnight-ntwrk/midnight-js-network-id', () => ({ setNetworkId: mocks.setNetworkId }));
vi.mock('@midnight-ntwrk/midnight-js-fetch-zk-config-provider', () => ({ FetchZkConfigProvider: class {} }));
vi.mock('@midnight-ntwrk/midnight-js-indexer-public-data-provider', () => ({ indexerPublicDataProvider: () => ({}) }));
vi.mock('@midnight-ntwrk/compact-runtime', () => ({ ContractState: { deserialize: vi.fn() } }));
vi.mock('@midnight-ntwrk/wallet-sdk-address-format', () => ({ MidnightBech32m: {}, ShieldedCoinPublicKey: {}, ShieldedEncryptionPublicKey: {} }));
import { createConnectedSession, createPrivateStateProvider, fromHex } from './midnight';

function mockWallet(networkId = 'preview') {
  return {
    getConfiguration: vi.fn(async () => ({ networkId, indexerUri: 'https://example.invalid/graphql', indexerWsUri: 'wss://example.invalid/graphql' })),
    getUnshieldedAddress: vi.fn(async () => ({ unshieldedAddress: 'wallet-address' })),
    getShieldedAddresses: vi.fn(async () => ({ shieldedCoinPublicKey: 'ab'.repeat(32), shieldedEncryptionPublicKey: 'cd'.repeat(32) })),
    getProvingProvider: vi.fn(async () => ({})),
    submitTransaction: vi.fn(async () => undefined),
  };
}
describe('Midnight connector boundary', () => {
  beforeEach(() => {
    mocks.setNetworkId.mockClear();
    vi.stubGlobal('window', { location: { origin: 'https://cairn.invalid' }, fetch: vi.fn(), localStorage: { getItem: () => null } });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('rejects a mismatched wallet before setting the global network', async () => {
    await expect(createConnectedSession(mockWallet('preprod') as unknown as ConnectedAPI, 'preview')).rejects.toThrow('Wallet is on preprod');
    expect(mocks.setNetworkId).not.toHaveBeenCalled();
  });
  it('uses the ledger identifier when connector submission returns void', async () => {
    const api = mockWallet();
    const session = await createConnectedSession(api as unknown as ConnectedAPI, 'preview');
    const tx = { identifiers: () => ['real-ledger-identifier'], serialize: () => new Uint8Array([1, 2]) };
    expect(await session.providers.midnightProvider.submitTx(tx as unknown as Parameters<MidnightProvider['submitTx']>[0])).toBe('real-ledger-identifier');
    expect(api.submitTransaction).toHaveBeenCalledWith('0102');
    session.dispose();
    await expect(session.providers.midnightProvider.submitTx(tx as unknown as Parameters<MidnightProvider['submitTx']>[0])).rejects.toThrow('session ended');
  });
  it('rejects invalid transaction hex rather than converting malformed bytes to zero', () => {
    expect(() => fromHex('0g')).toThrow();
    expect(() => fromHex('abc')).toThrow();
    expect(() => fromHex('')).toThrow();
    expect(fromHex('0x01ff')).toEqual(new Uint8Array([1, 255]));
  });
  it('requires a scope and wipes private byte arrays on removal/disconnect', async () => {
    const store = createPrivateStateProvider();
    await expect(store.get('invite')).rejects.toThrow('scope');
    const state = { memberSecret: new Uint8Array(32).fill(42), memberClearance: 3n, adminSecret: new Uint8Array(32).fill(57) };
    store.setContractAddress('gate'); await store.set('invite', state);
    expect(await store.get('invite')).toBe(state);
    await store.clear();
    expect(state.memberSecret.every((byte) => byte === 0)).toBe(true);
    expect(state.adminSecret.every((byte) => byte === 0)).toBe(true);
    expect(state.memberClearance).toBe(0n);
    expect(await store.get('invite')).toBeNull();
  });
});
