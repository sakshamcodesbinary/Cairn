# Cairn web client

React 19 + TypeScript + Vite application for private invitation access on Midnight.

```bash
npm ci
npm run dev
npm run build
npm run test:e2e
```

Run `npm run compile` from the parent directory after any contract edit. It synchronizes the generated bindings and public proving assets. Root `npm run test:app` runs adapter unit tests.

Routes: `/` overview, `/prove` invitation proof, `/registry` public ledger, `/admin` deployment and policy, `/docs` field guide. Operational routes load lazily. Day/night preference defaults to the OS and persists locally.

See the root README and `docs/SETUP.md` for wallet compatibility, public environment variables, deployment, CI and the level evidence checklist. Never put secrets in frontend environment variables.
