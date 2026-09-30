# Cairn Midnight implementation guide

This is the project-local implementation reference for the Cairn MVP. It summarizes the applied toolchain, witness model, browser integration and submission gates. The external master reference was consulted during development; source-specific examples were checked against the installed SDK rather than copied unquestioningly.

## 1. Toolchain

Use Node 22, Compact 0.31.1, Compact runtime 0.16.0, compact-js 2.5.1, Midnight.js 4.1.1 and ledger-v8 8.1.0. The root compile script invokes:

```bash
compact compile +0.31.1 contracts/cairn.compact contracts/managed/cairn
```

On Windows it runs the compiler inside WSL. The output is synchronized to both frontend managed directories. Real keys and ZKIR are checked in; do not replace them with placeholder files or compile with skipped proof generation for a release.

## 2. Public ledger and explicit private witnesses

The ledger exposes policy, the active invitation commitment, admission count, nullifiers and badges. Three witnesses—`member_secret`, `member_clearance`, and `admin_secret`—read from a contract-scoped session-only private-state provider.

`derive_member_key(secret, clearance)` binds the issued clearance into the invitation commitment. `derive_member_nullifier(secret)` prevents repeated admission. Hash domains are specific to Cairn. Reusing secrets between contracts remains linkable; issue fresh secrets.

State-changing APIs are:

```text
prove_access(badge_commitment)
update_gate(new_root, new_min, new_max)
set_gate_open(open_state)
```

The constructor has five public arguments: name, invitation commitment, threshold, capacity, admin commitment. Integer arithmetic is bounded/cast, capacity is positive and cannot be reduced below admissions, and badges are unique. There is one active invitation, not a Merkle allowlist.

## 3. Browser integration

- Discover `window.midnight` connectors, including `mnLace`, `1am`, and `nightly`.
- Connect to the selected `preview` or `preprod` network.
- Validate wallet configuration before `setNetworkId` and before every sensitive operation.
- Build a typed compiled contract using `CompiledContract.withWitnesses`, not vacant witnesses.
- Serve proving/verifying keys and ZKIR from `/managed` and actually fetch them before proving.
- Supply private state, public data, ZK config, proof, wallet balance and transaction-submission providers. This SDK has six roles, even if a reference calls it the five-provider pattern.
- Use `createUnprovenDeployTx` / `createUnprovenCallTx`, then `submitTxAsync`.
- Connector submission can return void. Derive the genuine identifier from the balanced transaction, never a made-up fallback.
- Treat submission separately from indexed successful execution; public badge membership is checked before exporting a confirmed admission receipt.

Browser delegation does not remove proving costs. The wallet’s configured proving service may process witness data. Do not claim that private inputs always remain on the physical client.

## 4. Runtime config and recovery

Addresses are product- and network-scoped in localStorage. Build variables supply the shared default for new visitors. No previous address is embedded. Secrets remain in session memory or an explicit unencrypted backup downloaded by the operator.

Disconnect clears the local application session; extension authorization can be revoked in wallet settings. Network changes clear private forms and invalidate the session. An indexer timeout does not cancel a submitted transaction.

## 5. Verification layers

```bash
npm run compile
npm run check
npm test
npm run test:app
npm run build
npm run test:e2e
```

The offline tests run against generated contract code. Browser tests use Playwright/axe. Full network integration is separate and requires Docker/proof infrastructure, DUST and a wallet. Read `docs/VALIDATION.md` for actual results, not assumed pass status.

## 6. Deployment and the levels

Use Preview for initial experiments and Preprod for Levels 2–4. The `/admin` page aligns constructor arguments with generated types and offers backup acknowledgement, deployment, policy updates, pause/resume and invite rotation.

No code generation can establish a public deployment, hosted CI run, meaningful repository history, approval, social profile or video. Those remain explicit tasks in `docs/LEVELS.md`. Do not insert fabricated links or carry another product’s evidence into the submission.

Detailed references within this project:

- `docs/SETUP.md` — toolchain, services, environment and hosting
- `docs/USAGE.md` — host, guest and verifier journeys
- `docs/ARCHITECTURE.md` — modules, providers and trust boundaries
- `contracts/README.md` — contract API and witness specification
- `SECURITY.md` — threat model and release gate
