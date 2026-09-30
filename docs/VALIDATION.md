# Cairn local validation report

This report records local engineering checks, not a deployment or a claim that any submission level has passed.

## Verified

| Check | Actual result |
|---|---|
| Compact compilation | Passed with Compact 0.31.1 through WSL; real proving/verifying keys generated |
| State-changing circuits | `prove_access`, `update_gate`, `set_gate_open` |
| Generated artifacts | 16 files per managed output; both frontend copies synchronized |
| Backend/scripts TypeScript | `npm run check` passed |
| Generated-contract tests | **25 passed** |
| Browser integration utility tests | **16 passed** across four files |
| Node 22 compatibility | Both unit suites also passed under **Node 22.23.3** |
| Frontend TypeScript and production bundle | `npm run build` passed |
| Production-build browser suite | **10 passed** with Chromium; Playwright builds and serves the production bundle |
| Responsive layout | All five routes fit 375px, 768px and 1440px widths without horizontal overflow |
| Automated accessibility | axe WCAG 2 A/AA and 2.1 AA scans reported no violations on the five routes in day and night modes |
| Theme behavior | Toggle, OS default path, persistence and reduced-motion behavior exercised |
| Wallet absence | Explicit missing-wallet error; no simulated connection or proof success |
| Credential flow | Random generation, masked inputs, backup download/acknowledgement and network-change cleanup exercised |
| Runtime address configuration | Invalid input rejected; valid addresses separated by network |
| Production smoke | Five routes, zero uncaught browser errors; homepage does not request ledger WASM |
| Public proving assets | Nine binary key/ZKIR URLs checked; no HTML SPA fallback |
| Dependency audit | Root and frontend each reported **0 known vulnerabilities** at validation time |
| Lockfile consistency | Both `npm ci --dry-run --ignore-scripts` checks passed |
| Product cleanup | No prior product branding or deployment/profile links found in maintained source/docs/assets |

The browser suite checks real UI behavior without fabricating a wallet or on-chain results. It does not substitute for an actual funded-wallet deployment. Automated accessibility checks are useful coverage, not a guarantee of complete accessibility.

## Commands

```bash
npm run compile
npm run check
npm test
npm run test:app
npm run build
npm run test:e2e
npm audit --audit-level=low
npm audit --prefix frontend --audit-level=low
```

Node 22 unit-suite cross-check:

```bash
npm exec --yes --package=node@22 -- node node_modules/vitest/vitest.mjs run
npm exec --yes --package=node@22 -- node node_modules/vitest/vitest.mjs run --config frontend/vite.config.ts frontend/src/lib
```

Additional production smoke (separate terminals):

```bash
npm run preview --prefix frontend -- --host 127.0.0.1 --port 4173
node frontend/tests/production-smoke.mjs
```

UI review screenshots are in `docs/screenshots/cairn-review-*.png`. They are captures of Cairn’s own production UI, not compile, deployment or hosted-CI evidence.

## Problems found and corrected during validation

- Replaced self-asserted clearance with a credential commitment that binds the issued clearance.
- Added explicit private witnesses instead of treating secret-looking public circuit arguments as sufficient.
- Removed fixed demo secrets, stale contract addresses and simulated proof success.
- Added strict network/session checks, actual transaction identifiers and confirmation states.
- Fixed a narrow-screen long-indexer-URL wrap and verified it at 375px.
- Changed browser tests from a cold dev server to a built preview server to avoid Vite dependency-reoptimization reload races and test what is actually shipped.
- Added browser-compatible assertion and WebSocket adapters for upstream SDK imports; removed their prior browser externalization/missing-export warnings.
- Applied nonbreaking dependency fixes and a scoped `uuid` 11.1.1+ override for the top-level-await build plugin; the build and tests pass with the patched dependency.

## Remaining warnings

- The compiled contract’s generated sourcemap references source locations that are absent in the copied frontend tree. This does not affect circuit execution; generated files were not hand-edited to suppress it.
- Midnight’s ledger WASM is approximately 10 MB uncompressed, and the lazy SDK JavaScript chunk exceeds Vite’s 500 KB warning threshold. The overview defers it; real transaction pages still need the cryptographic runtime. The warning is disclosed rather than hidden.

## Not verified / not performed

- No funded Lace, 1AM or Nightly wallet transaction was submitted.
- No Preview or Preprod contract was deployed, and no address was invented.
- Docker CLI was present, but Docker Desktop’s Linux daemon was not available. Docker-backed full network tests were not run.
- No hosted GitHub Actions run or public frontend deployment exists yet.
- No repository, commits, product X account, approval or live demo video was created.

These external gates and evidence requirements are enumerated in `docs/LEVELS.md`.
