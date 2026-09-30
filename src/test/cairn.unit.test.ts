import { describe, expect, it } from 'vitest';
import { createCircuitContext, createConstructorContext, dummyContractAddress, type CircuitContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { Contract, ledger, pureCircuits, witnesses, type CairnPrivateState } from '../../contracts/index.js';

const bytes = (value: number) => new Uint8Array(32).fill(value);
const privateState = (): CairnPrivateState => ({ memberSecret: bytes(3), memberClearance: 3n, adminSecret: bytes(7) });
const coinKey = '00'.repeat(32);
const badge = bytes(55);

// Executes the real compiler-generated contract and runtime, not a policy mock.
function gate(minimum = 2n, capacity = 3n, state = privateState()) {
  const contract = new Contract<CairnPrivateState>(witnesses);
  const initial = contract.initialState(createConstructorContext(state, coinKey), bytes(1),
    pureCircuits.derive_member_key(state.memberSecret, state.memberClearance), minimum, capacity,
    pureCircuits.derive_admin_key(state.adminSecret));
  let context: CircuitContext<CairnPrivateState> = createCircuitContext(dummyContractAddress(), coinKey, initial.currentContractState, initial.currentPrivateState);
  return {
    contract,
    get context() { return context; },
    get state() { return ledger(context.currentQueryContext.state); },
    credentials(patch: Partial<CairnPrivateState>) {
      context = { ...context, currentPrivateState: { ...context.currentPrivateState, ...patch } };
    },
    prove(commitment = badge) { context = contract.impureCircuits.prove_access(context, commitment).context; },
    rotate(secret = bytes(4), clearance = 4n, min = minimum, max = capacity) {
      context = contract.impureCircuits.update_gate(context, pureCircuits.derive_member_key(secret, clearance), min, max).context;
    },
    open(value: boolean) { context = contract.impureCircuits.set_gate_open(context, value).context; },
  };
}

describe('Cairn commitment circuits', () => {
  it('derives stable 32-byte domain-separated commitments', () => {
    const secret = bytes(3);
    const member = pureCircuits.derive_member_key(secret, 3n);
    expect(member).toHaveLength(32);
    expect(member).toEqual(pureCircuits.derive_member_key(secret, 3n));
    const hashes = [member, pureCircuits.derive_member_nullifier(secret), pureCircuits.derive_admin_key(secret)];
    expect(new Set(hashes.map(value => Buffer.from(value).toString('hex'))).size).toBe(3);
  });
  it('binds both secret and clearance into the approved invite', () => {
    const key = pureCircuits.derive_member_key(bytes(3), 3n);
    expect(key).not.toEqual(pureCircuits.derive_member_key(bytes(4), 3n));
    expect(key).not.toEqual(pureCircuits.derive_member_key(bytes(3), 4n));
  });
  it.each([-1n, 256n])('rejects clearance outside Uint8 (%s)', clearance => {
    expect(() => pureCircuits.derive_member_key(bytes(3), clearance)).toThrow();
  });
  it('rejects malformed secret lengths', () => {
    expect(() => pureCircuits.derive_member_key(new Uint8Array(31), 3n)).toThrow();
    expect(() => pureCircuits.derive_admin_key(new Uint8Array(33))).toThrow();
  });
});

describe('Cairn private witnesses', () => {
  it('reads credentials from private state and preserves it', () => {
    const g = gate();
    const context = { ledger: g.state, privateState: g.context.currentPrivateState, contractAddress: dummyContractAddress() };
    expect(witnesses.member_secret(context)).toEqual([context.privateState, bytes(3)]);
    expect(witnesses.member_clearance(context)).toEqual([context.privateState, 3n]);
    expect(witnesses.admin_secret(context)).toEqual([context.privateState, bytes(7)]);
  });
  it('exposes only policy, commitments and counters on the ledger', () => {
    expect(Object.keys(gate().state).sort()).toEqual([
      'gate_name', 'allowlist_root', 'minimum_clearance', 'max_entries', 'verified_entries',
      'nullifiers', 'badge_registry', 'admin_public_key', 'is_open',
    ].sort());
  });
});

describe('Cairn generated gate circuits', () => {
  it('initializes a five-argument gate with empty registries', () => {
    const { state } = gate();
    expect(state.gate_name).toEqual(bytes(1));
    expect(state.minimum_clearance).toBe(2n);
    expect(state.max_entries).toBe(3n);
    expect(state.verified_entries).toBe(0n);
    expect(state.nullifiers.isEmpty()).toBe(true);
    expect(state.badge_registry.isEmpty()).toBe(true);
    expect(state.is_open).toBe(true);
  });
  it.each([0n, -1n, 4294967296n])('rejects invalid initial capacity %s', capacity => {
    expect(() => gate(2n, capacity)).toThrow();
  });
  it('admits a matching invite and publishes its badge and nullifier', () => {
    const g = gate();
    g.prove();
    expect(g.state.verified_entries).toBe(1n);
    expect(g.state.nullifiers.member(pureCircuits.derive_member_nullifier(bytes(3)))).toBe(true);
    expect(g.state.badge_registry.member(badge)).toBe(true);
    expect(g.context.currentPrivateState).toEqual(privateState());
  });
  it('accepts clearance exactly at the threshold', () => {
    const g = gate(3n);
    g.prove();
    expect(g.state.verified_entries).toBe(1n);
  });
  it('rejects unknown secrets without changing the ledger', () => {
    const g = gate();
    g.credentials({ memberSecret: bytes(99) });
    expect(() => g.prove()).toThrow(/Invite commitment/);
    expect(g.state.verified_entries).toBe(0n);
    expect(g.state.badge_registry.isEmpty()).toBe(true);
  });
  it('rejects authentic but below-threshold credentials', () => {
    expect(() => gate(4n).prove()).toThrow(/Clearance level/);
  });
  it('prevents self-asserted clearance escalation even with the correct secret', () => {
    const g = gate(4n);
    g.credentials({ memberClearance: 4n });
    expect(() => g.prove()).toThrow(/Invite commitment/);
  });
  it('prevents replay with a different badge', () => {
    const g = gate();
    g.prove();
    expect(() => g.prove(bytes(56))).toThrow(/already entered/);
    expect(g.state.verified_entries).toBe(1n);
  });
  it('enforces capacity before incrementing the counter', () => {
    const g = gate(2n, 1n);
    g.prove();
    g.rotate();
    g.credentials({ memberSecret: bytes(4), memberClearance: 4n });
    expect(() => g.prove(bytes(56))).toThrow(/capacity reached/);
    expect(g.state.verified_entries).toBe(1n);
  });
  it('allows admin pause/resume without resetting history', () => {
    const g = gate();
    g.open(false);
    expect(() => g.prove()).toThrow(/closed/);
    g.open(true);
    g.prove();
    g.open(false);
    g.open(true);
    expect(() => g.prove()).toThrow(/already entered/);
  });
  it('rejects non-admin rotation and pause', () => {
    const g = gate();
    const root = g.state.allowlist_root;
    g.credentials({ adminSecret: bytes(99) });
    expect(() => g.rotate()).toThrow(/Administrator/);
    expect(() => g.open(false)).toThrow(/Administrator/);
    expect(g.state.allowlist_root).toEqual(root);
    expect(g.state.is_open).toBe(true);
  });
  it('rotates the single active invite and preserves old badges', () => {
    const g = gate();
    g.prove();
    g.rotate();
    expect(() => g.prove(bytes(56))).toThrow(/Invite commitment/);
    g.credentials({ memberSecret: bytes(4), memberClearance: 4n });
    g.prove(bytes(56));
    expect(g.state.verified_entries).toBe(2n);
    expect(g.state.nullifiers.size()).toBe(2n);
    expect(g.state.badge_registry.size()).toBe(2n);
    expect(g.state.badge_registry.member(badge)).toBe(true);
  });
  it('rejects badge reuse across distinct invites', () => {
    const g = gate();
    g.prove();
    g.rotate();
    g.credentials({ memberSecret: bytes(4), memberClearance: 4n });
    expect(() => g.prove()).toThrow(/Badge commitment/);
    expect(g.state.verified_entries).toBe(1n);
  });
  it('retains nullifiers when the same secret is approved at a different clearance', () => {
    const g = gate();
    g.prove();
    g.rotate(bytes(3), 5n);
    g.credentials({ memberClearance: 5n });
    expect(() => g.prove(bytes(56))).toThrow(/already entered/);
  });
  it('rejects zero capacity and reductions below existing admissions', () => {
    const g = gate();
    expect(() => g.rotate(bytes(4), 4n, 2n, 0n)).toThrow(/positive/);
    g.prove();
    g.rotate();
    g.credentials({ memberSecret: bytes(4), memberClearance: 4n });
    g.prove(bytes(56));
    expect(() => g.rotate(bytes(5), 5n, 2n, 1n)).toThrow(/below verified/);
    expect(g.state.max_entries).toBe(3n);
    g.rotate(bytes(5), 5n, 2n, 2n);
    expect(g.state.max_entries).toBe(2n);
  });
  it('updates policy while paused without reopening the gate', () => {
    const g = gate();
    g.open(false);
    g.rotate(bytes(4), 9n, 8n, 10n);
    expect(g.state.minimum_clearance).toBe(8n);
    expect(g.state.max_entries).toBe(10n);
    expect(g.state.is_open).toBe(false);
    expect(g.state.admin_public_key).toEqual(pureCircuits.derive_admin_key(bytes(7)));
  });
});
