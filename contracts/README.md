# Cairn gate contract

`cairn.compact` is the source of truth. Compile using `npm run compile` (Compact
0.31.1). The script invokes the real compiler and generates all three circuits'
proving/verifying keys, then copies output to `frontend/src/managed` and
`frontend/public/managed`. Do not hand-edit generated files. On Windows this uses
WSL Ubuntu, user `<username>`, and `/home/<username>/.local/bin/compact`; override
`MIDNIGHT_WSL_DISTRO`, `MIDNIGHT_WSL_USER`, or `COMPACT_BIN` if necessary.

## Policy and threat model

Despite its compatibility name, `allowlist_root` is **one active invite
commitment**, not a Merkle root or a multi-member allowlist. An administrator
approves `(secret, clearance)` by computing `derive_member_key(secret, clearance)`
and rotates the active invite using `update_gate`. Rotation invalidates the old
invite but retains all historical nullifiers, badges, and admission counts.
The administrator key itself is immutable; “rotation” means invite rotation.

The clearance is committed with the secret: possession of an invite cannot be
used to claim a higher clearance. Each secret can enter once, even if reapproved
at a different clearance. Distinct admissions cannot reuse a badge. A shared
invite is a bearer credential: whoever proves first consumes it. Issue unique,
high-entropy 32-byte secrets and use different secrets for administrator/member
roles. Hashes do not make low-entropy credentials safe.

Capacity must be positive, cannot be reduced below verified admissions, and is
checked before incrementing the bounded counter. Pausing blocks admission only;
the administrator can still rotate policy and resume. Badges are public opaque
commitments, not identities or transferable tokens. The contract enforces badge
uniqueness but does not prove ownership of a badge preimage.

Public ledger fields remain: `gate_name`, `allowlist_root`, `minimum_clearance`,
`max_entries`, `verified_entries`, `nullifiers`, `badge_registry`,
`admin_public_key`, `is_open`. Nullifiers are deterministic per secret (not scoped
to a deployment); reusing a secret across gates permits correlation. Policy,
counts, badges, nullifiers, transaction metadata and timing remain public.

## API

Constructor: `(name: Bytes<32>, root: Bytes<32>, min: Uint<8>, max: Uint<32>,
adminHash: Bytes<32>)`.

Pure circuits:
- `derive_member_key(secret: Bytes<32>, clearance: Uint<8>): Bytes<32>`
- `derive_member_nullifier(secret: Bytes<32>): Bytes<32>`
- `derive_admin_key(secret: Bytes<32>): Bytes<32>`

Transaction circuits (public arguments only):
- `prove_access(badge_commitment: Bytes<32>)`
- `update_gate(new_root: Bytes<32>, new_min: Uint<8>, new_max: Uint<32>)`
- `set_gate_open(open_state: Boolean)`

Private witnesses: `member_secret(): Bytes<32>`, `member_clearance(): Uint<8>`,
`admin_secret(): Bytes<32>`. The shared `witnesses` export in `contracts/index.ts`
returns `[unchangedPrivateState, value]`. `CairnPrivateState` is:

```ts
{
  memberSecret: Uint8Array; // exactly 32 bytes
  memberClearance: bigint; // 0n..255n
  adminSecret: Uint8Array;  // exactly 32 bytes
}
```

Witness credentials never belong in public circuit arguments, frontend public
config, logs, or committed environment files. A member-only client can use a
32-byte placeholder for its unused admin secret; an admin-only client can use
placeholder member credentials. The relevant witness must always hold the real
credential for the circuit being executed.

## Verification and deployment

`npm test` executes the actual generated contract/runtime offline, with no wallet,
proof server or RPC. It is not a network proof-verification test. `npm run check`
typechecks backend, shared bindings and scripts. `npm run build` builds frontend.
CI runs compilation, offline tests, typechecking and frontend build on every push
and pull request using Node 22; it does not deploy or require wallet credentials.

Network tests are opt-in: start matching services and provide
`CAIRN_PRIVATE_STORAGE_PASSWORD` (at least 16 characters), then run
`npm run test:local`, `npm run test:preview`, or `npm run test:preprod`.
Remote tests require `MIDNIGHT_<NETWORK>_MNEMONIC` or `MIDNIGHT_<NETWORK>_SEED`, not
both, and a funded wallet. They submit real transactions. No deployment workflow
is enabled.

For explicit preview/preprod deployment use `npm run deploy:preview` or
`npm run deploy:preprod` with wallet credentials above and:

- `CAIRN_MEMBER_SECRET_HEX`, `CAIRN_ADMIN_SECRET_HEX`: 64 hex characters each
- `CAIRN_PRIVATE_STORAGE_PASSWORD`: strong private-state encryption password
- `CAIRN_GATE_NAME`: at most 32 UTF-8 bytes (default `Cairn`)
- `CAIRN_MEMBER_CLEARANCE` (default 3), `CAIRN_MINIMUM_CLEARANCE` (default 2)
- `CAIRN_MAX_ENTRIES` (default 250)
- optionally `MIDNIGHT_PROOF_SERVER` (default `http://127.0.0.1:6300`)

Deployment persists witness state in an encrypted network/account-scoped local
store and writes only the address to `contracts/managed/<network>-address.txt`.
Back up the password and credentials securely. Do not commit the local database.
These CLI tools do not load dotenv files implicitly; pass environment variables
through your shell or secret manager.
