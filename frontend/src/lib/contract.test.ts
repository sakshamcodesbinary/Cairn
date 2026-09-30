import { describe, expect, it, vi } from 'vitest';
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
vi.mock('./midnight', () => ({ assertSessionNetwork: vi.fn(), fromHex: vi.fn(), indexerQuery: vi.fn(), wipePrivateState: vi.fn() }));
import { emptyPrivateState, parseInteger, pureCircuits, validateAddress, witnesses, type CairnPrivateState, type Ledger } from './contract';

describe('Cairn circuit adapter', () => {
  it('rejects truncated numbers, decimals, signs, and overflow', () => {
    for (const invalid of ['2foo', '2.5', '-1', '+3', '256', '']) expect(() => parseInteger(invalid, 'Clearance', 0n, 255n)).toThrow();
    expect(parseInteger('255', 'Clearance', 0n, 255n)).toBe(255n);
  });
  it('validates and canonicalizes contract addresses', () => {
    expect(validateAddress('0x' + 'AB'.repeat(32))).toBe('ab'.repeat(32));
    expect(() => validateAddress('')).toThrow();
  });
  it('returns the current private state and private witness values without public arguments', () => {
    const privateState = emptyPrivateState();
    privateState.memberSecret.fill(23); privateState.memberClearance = 3n; privateState.adminSecret.fill(47);
    const context = { privateState } as WitnessContext<Ledger, CairnPrivateState>;
    expect(witnesses.member_secret(context)).toEqual([privateState, privateState.memberSecret]);
    expect(witnesses.member_clearance(context)).toEqual([privateState, 3n]);
    expect(witnesses.admin_secret(context)).toEqual([privateState, privateState.adminSecret]);
  });
  it('binds the issued clearance into the invitation commitment', () => {
    const secret = new Uint8Array(32).fill(23);
    expect(pureCircuits.derive_member_key(secret, 2n)).not.toEqual(pureCircuits.derive_member_key(secret, 3n));
    expect(pureCircuits.derive_member_key(secret, 2n)).not.toEqual(pureCircuits.derive_member_nullifier(secret));
  });
});
