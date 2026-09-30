# Cairn setup

## Supported toolchain

- Node **22 LTS** and npm. Keep both lockfiles; root and frontend are separate packages.
- Compact **0.31.1** for the checked-in artifacts.
- Compact runtime **0.16.0**, compact-js **2.5.1**, Midnight.js **4.1.1**, ledger-v8 **8.1.0**. Upgrade this family deliberately, not one ABI package in isolation.
- A modern Chromium browser and a Midnight wallet supporting connector **4.x**, including `getProvingProvider` and `balanceUnsealedTransaction`.
- Docker Desktop / Engine for an optional local node/indexer/proof server.

Install the Compact toolchain using Midnight’s official installation instructions. Verify that `compact compile +0.31.1` is available. The generated outputs must come from the compiler, never handwritten mocks.

## Install and run

```bash
npm ci
npm ci --prefix frontend
npm run compile
npm run check
npm test
npm run test:app
npm run build
npm run dev --prefix frontend
```

`npm run compile` regenerates all three circuit keys and synchronizes the full output to `frontend/src/managed` and `frontend/public/managed`. A frontend-only build can use the included generated artifacts, but a contract change always requires compilation.

## Windows / WSL

Windows has an unrelated file-compression `compact.exe`. Do not use it for a Midnight contract. Install the Midnight toolchain in a WSL Linux distribution and configure the wrapper:

```powershell
$env:MIDNIGHT_WSL_DISTRO = "Ubuntu"
$env:MIDNIGHT_WSL_USER = "your-linux-user"
$env:COMPACT_BIN = "/home/your-linux-user/.local/bin/compact"
npm run compile
```

On Linux/macOS, `COMPACT_BIN` can select an absolute compiler launcher path. The wrapper explicitly requests `+0.31.1` so a stale default-toolchain link does not silently change compiler versions.

## Frontend configuration

Copy `frontend/.env.example` to `frontend/.env.local`. All `VITE_*` values are public and embedded in the bundle. Never put a wallet seed, admin secret, invite secret or proving password there.

| Variable | Meaning |
|---|---|
| `VITE_NETWORK` | `preview` (default) or `preprod` |
| `VITE_PREVIEW_CONTRACT_ADDRESS` | Optional shared default on Preview |
| `VITE_PREPROD_CONTRACT_ADDRESS` | Optional shared default on Preprod |
| `VITE_CONTRACT_ADDRESS` | Optional fallback only for `VITE_NETWORK` |
| `VITE_PREVIEW_INDEXER_URL` / `_WS_URL` | Public read provider overrides |
| `VITE_PREPROD_INDEXER_URL` / `_WS_URL` | Public read provider overrides |

The connected wallet supplies the transaction session’s indexer configuration. Align the wallet’s network and public read-provider configuration. Endpoint versions are deployment-specific; a guide’s example `/api/v4` URL is not proof that a hosted endpoint exposes that version.

Per-network browser address keys are `cairn:v1:preview:contract` and `cairn:v1:preprod:contract`. Theme uses `cairn:theme:v1`. None contain secrets. Local configuration takes precedence over the public build default; use a clean browser to verify your published default.

## Browser deployment

Use `/admin`, choose the network, and connect a funded wallet. Generate credentials, securely back up, acknowledge storage, and deploy. The wallet handles the proof service and transaction balancing; this may still take time and resources. DUST and a working proving provider remain prerequisites.

The UI stores an address only after transaction submission. It then waits for a successful indexed result. If indexing times out, inspect the explorer and use the confirmation retry rather than blindly submitting again.

## Optional Docker integration

```bash
npm run env:up
npm run wait:dust
npm run test:local
npm run env:down
```

Always stop services after an integration session, including on failure. `compose.yml` binds services to loopback. Do not expose unsafe node RPC methods on a public host. Offline tests do not require Docker or funding.

For a proof server only:

```bash
npm run proof:up
npm run proof:down
```

Docker Desktop must be running, not merely installed. Its daemon was unavailable in the initial local validation; full Docker-backed proof/transaction execution is therefore not claimed.

## Optional CLI deployment and remote integration

Browser deployment is the default path. `.env.preview.example` and `.env.preprod.example` document the CLI variables. Create an ignored environment file, set one wallet mnemonic **or** seed, use independently random member/admin secrets, and choose a private-storage password of at least 16 characters.

The scripts do not silently load environment files. Supply them explicitly, for example:

```bash
node --env-file=.env.preprod node_modules/vite-node/vite-node.mjs scripts/deploy.ts
```

Or export the variables in your shell and run `npm run deploy:preprod`. Network tests use `npm run test:preprod` or `npm run test:preview`; they deploy/call contracts and require funded wallets. Do not place secrets in CI for offline validation.

## Hosting

- **Vercel:** choose `frontend` as root. The checked-in Vercel config builds `dist` and supports SPA routes.
- **Netlify:** the root `netlify.toml` sets `frontend` as base and publishes `dist`.
- Configure `VITE_NETWORK=preprod` and the real new Preprod address for the shared demo, then build.
- `/managed/keys/*`, `/managed/zkir/*`, fonts and images must be static assets, not rewritten into `index.html`.
- Use HTTPS for wallet APIs and clipboard access (localhost is acceptable for development).

After hosting, test direct navigation to `/admin`, `/prove`, `/registry`, and actual managed binary fetches. Do not infer a successful deployment solely from the static frontend building.
