import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Contract, type Witnesses } from './managed/cairn/contract/index.js';

export {
  Contract, ledger, pureCircuits,
  type Ledger, type ImpureCircuits, type PureCircuits, type Witnesses,
} from './managed/cairn/contract/index.js';

/** Local private state. Never serialize these credentials into public app config. */
export type CairnPrivateState = {
  memberSecret: Uint8Array;
  memberClearance: bigint;
  adminSecret: Uint8Array;
};

/** Witnesses read local state and return it unchanged alongside the private value. */
export const witnesses: Witnesses<CairnPrivateState> = {
  member_secret: ({ privateState }) => [privateState, privateState.memberSecret],
  member_clearance: ({ privateState }) => [privateState, privateState.memberClearance],
  admin_secret: ({ privateState }) => [privateState, privateState.adminSecret],
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(currentDir, 'managed', 'cairn');
export const CompiledCairnContract = CompiledContract.make<Contract<CairnPrivateState>>(
  'CairnGate', Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
