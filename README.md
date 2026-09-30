# Cairn

### Leave a proof. Not a profile.

[![Midnight Network](https://img.shields.io/badge/Network-Midnight-blueviolet?style=for-the-badge)](https://midnight.network)
[![Language](https://img.shields.io/badge/Language-Compact-orange?style=for-the-badge)](https://midnight.network)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Tested With](https://img.shields.io/badge/Tested%20With-Vitest-yellow?style=for-the-badge)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Apache--2.0-green?style=for-the-badge)](LICENSE)
[![CI](https://github.com/sakshamcodesbinary/Cairn/actions/workflows/ci.yaml/badge.svg)](https://github.com/sakshamcodesbinary/Cairn/actions/workflows/ci.yaml)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://cairn-green-nu.vercel.app/)

Cairn is a private invitation gate built with Compact and Midnight. A member proves that an issued invitation is valid and meets a public clearance policy. The contract registers a one-time badge without putting the invitation secret, exact clearance, or administrator secret on the public ledger.

**Selected idea: Private Allowlist Access.** This is a test-network MVP, not an audited production identity or access-control system.

---

### Maintainer & Author
**Saksham Singh** — [@sakshamcodesbinary](https://github.com/sakshamcodesbinary)  
Repository: [https://github.com/sakshamcodesbinary/Cairn](https://github.com/sakshamcodesbinary/Cairn)

---

## Table of Contents

1. [Official Submission Links](#official-submission-links)
2. [Architectural Overview](#architectural-overview)
3. [The Product Idea](#the-product-idea)
4. [Zero-Knowledge Privacy Model](#zero-knowledge-privacy-model)
5. [Smart Contract Implementation](#smart-contract-implementation)
6. [Project Features](#project-features)
7. [Hackathon Progression](#hackathon-progression-levels-1-4)
8. [Project Showcase & Verification Proofs](#project-showcase--verification-proofs)
9. [Local Development & Setup Guide](#local-development--setup-guide)
10. [Contributing, Security, and License](#contributing-security-and-license)

---

## Official Submission Links

- **Live Application:** [https://cairn-green-nu.vercel.app/](https://cairn-green-nu.vercel.app/)
- **Deployed Contract (Midnight Preprod):** `mn_addr_preprod1ezxkztduas5uxhx6g2tfvtet39pztkl0neexs9wxncffc9q3zxtsmr6zkl`
- **Deployment Transaction:** `82a9c440c7afd840814e471d4cf773543c953b81edd8c254445d9747a20dc019`
- **Demo Video:** [Watch on Google Drive](https://drive.google.com/file/d/1GFFPuCnS3hPzLzz9S3uNuiRTQmQwGvWy/view?usp=sharing)
- **Maintainer:** [Saksham Singh](https://github.com/sakshamcodesbinary)

---

## Live Deployment & Contract Address

- **Public Demo / Deployment**: [https://cairn-green-nu.vercel.app/](https://cairn-green-nu.vercel.app/)
- **Preprod Contract Address**: `mn_addr_preprod1ezxkztduas5uxhx6g2tfvtet39pztkl0neexs9wxncffc9q3zxtsmr6zkl`
- **Deployment Transaction**: `82a9c440c7afd840814e471d4cf773543c953b81edd8c254445d9747a20dc019`

---

## User Interface Showcase


<img width="1896" height="910" alt="User Interface 2" src="https://github.com/user-attachments/assets/4b12c775-d071-415f-82e3-0ce5a7ddd15a" />

<img width="1902" height="912" alt="User Interface 3" src="https://github.com/user-attachments/assets/4346897f-77d9-47f8-b9ab-777fcff97e36" />

<img width="1892" height="908" alt="User Interface 4" src="https://github.com/user-attachments/assets/3e8ed60b-5bff-40a6-9a8e-76aa1b906c05" />

<img width="1900" height="911" alt="User Interface 5" src="https://github.com/user-attachments/assets/e0dec9f7-2c81-4ae5-845b-8cd9ae69e87a" />

<img width="1901" height="912" alt="User Interface 1" src="https://github.com/user-attachments/assets/dc378ef8-09ee-479c-bbd2-8531e65dbdb4" />


---

## Demo Video

🎬 **[Watch Full Demo Video on Google Drive](https://drive.google.com/file/d/1GFFPuCnS3hPzLzz9S3uNuiRTQmQwGvWy/view?usp=sharing)**

---

## Verification & Proof Screenshots

### CI/CD & Automated Verification Proofs
<img width="1218" height="417" alt="CI/CD Verification Proof" src="https://github.com/user-attachments/assets/b599eced-ac8e-4624-8a3b-2db52fe37ec8" />

### Npm Run Dev Proofs
<img width="1901" height="577" alt="Npm Run Dev Proof" src="https://github.com/user-attachments/assets/0190ee44-deef-4829-8f24-1e7cd3143281" />

### Npm Run Tests Proofs
<img width="1217" height="371" alt="Npm Run Tests Proof" src="https://github.com/user-attachments/assets/03e10eda-12d6-4455-96aa-42a422beae53" />

---

## Architectural Overview

Cairn connects a browser application, a Compact zero-knowledge contract, and the Midnight Preprod network.

- **Smart contract layer:** `contracts/cairn.compact` defines the public gate policy, one active invitation commitment, replay-protection nullifiers, badge registry, administrator authorization, and capacity checks.
- **Frontend application layer:** React, TypeScript, Vite, React Router, and Lucide provide the Admin, invitation, and public Registry flows.
- **Wallet and proving layer:** the Midnight DApp Connector API discovers compatible Lace, 1AM, and Nightly connectors for wallet-assisted proving and transaction signing.
- **Public data layer:** anyone can read the indexed gate policy and badge registry without connecting a wallet.
- **Verification layer:** Vitest, TypeScript checks, Playwright accessibility checks, and GitHub Actions verify the contract and application.

## The product idea

Small research circles, field teams, and invitation-only gatherings need to know whether someone is invited—not collect another identity profile. Cairn replaces a public guest list with an organizer-issued, single-use invitation. A zero-knowledge proof checks the invitation and its bound clearance, while a public registry lets a verifier check the resulting badge. The organizer controls the policy and can pause admissions or rotate to the next invitation without publishing member credentials.

## Zero-Knowledge Privacy Model

### Public state and private witnesses

The contract discloses the gate policy, admission count, nullifier, and badge commitment needed for verification. It never discloses the invitation secret, issued clearance, or administrator secret.

1. The organizer creates a domain-separated commitment from an invitation secret and its issued clearance.
2. The guest supplies the secret and exact clearance as private witnesses in the browser wallet.
3. The Compact circuit checks the commitment, clearance threshold, gate status, capacity, and replay state.
4. The wallet submits a proof; the Midnight network verifies the proof without receiving the raw invitation values.

**Visible on-chain:** gate name, invitation commitment, minimum clearance, capacity, admission count, nullifiers, badge commitments, and administrator public key.

**Private:** invitation secret, issued clearance, and administrator secret.

See [SECURITY.md](SECURITY.md) for trust boundaries and limitations.

## Smart Contract Implementation

The contract exposes three state-changing circuits:

```text
prove_access(badge_commitment)
update_gate(new_root, new_min, new_max)
set_gate_open(open_state)
```

`prove_access` validates the private invitation witness, prevents reuse through a deterministic nullifier, registers a unique public badge, and increments the admission count. `update_gate` rotates the active invitation and policy. `set_gate_open` pauses or resumes admissions. The full source is in [`contracts/cairn.compact`](contracts/cairn.compact).

## Project Features

- A newly compiled Compact contract with explicit member and administrator witnesses, domain-separated commitments, replay protection, unique badges, and capacity checks.
- Browser deployment on **Preview** by default, with **Preprod** available for the Level 2–4 submission.
- Midnight Lace / 1AM / Nightly connector discovery, connect/disconnect and network guards. The wallet must support connector 4.x wallet-assisted proving.
- Real circuit submission with separate **submitted** and **indexed successfully** states. No simulated successful proofs or invented addresses.
- Administrator policy changes, invitation rotation, pause and resume.
- Wallet-free public ledger reads and badge lookups.
- An alpine visual identity, locally served imagery and fonts, responsive layouts, keyboard navigation and persistent day/night mode.
- Offline generated-contract tests, integration utility tests, browser/accessibility checks and a compile/test/build CI workflow.

### Current release evidence

| Item | Status |
|---|---|
| Compact compilation + generated keys | Verified locally; three state-changing circuits |
| Offline contract / application tests | Included and locally verified; see `docs/VALIDATION.md` |
| Browser build and responsive/accessibility checks | See `docs/VALIDATION.md` for actual results |
| Contract address | `mn_addr_preprod1ezxkztduas5uxhx6g2tfvtet39pztkl0neexs9wxncffc9q3zxtsmr6zkl` |
| Public demo | [cairn-green-nu.vercel.app](https://cairn-green-nu.vercel.app/) |
| Hosted CI run | Verified passing on GitHub Actions |
| Demo video | [Google Drive](https://drive.google.com/file/d/1GFFPuCnS3hPzLzz9S3uNuiRTQmQwGvWy/view?usp=sharing) |
| UI and verification screenshots | Included above |

## Quick start

Use **Node 22**, npm, and **Compact compiler 0.31.1**. Docker is needed for local proof-server/network integration tests, not for offline unit tests or merely viewing the UI.

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

Open the local Vite address printed in the terminal. There are no working demo credentials embedded in the app. You can explore the UI without a wallet; a real transaction requires a compatible funded wallet.

**Windows:** `compact.exe` included with Windows compresses files; it is not the Midnight compiler. `npm run compile` runs the real compiler through WSL. Configure `MIDNIGHT_WSL_DISTRO`, `MIDNIGHT_WSL_USER` and optionally `COMPACT_BIN` for your installation. See [setup](docs/SETUP.md).

The compiler synchronizes artifacts into both frontend locations automatically:

```text
contracts/cairn.compact
  → contracts/managed/cairn/
  → frontend/src/managed/
  → frontend/public/managed/
```

All managed artifacts are generated. Never edit them manually. Check in the generated directories when you create the repository.

## Deploy in the browser

1. Start the app and open **Admin** (`/admin`). Select Preview or Preprod. Use **Preprod** for the higher-level submission.
2. Connect the wallet on that same network. Ensure DUST is available and the wallet’s proving service is operational.
3. Enter a gate name, minimum clearance, capacity and the invitation’s issued clearance.
4. Generate random credentials. Download the **private admin backup** and acknowledge secure offline storage. It contains secrets and a maintenance signing key; never commit or share it.
5. Select **Deploy gate** and approve the wallet request. Proof generation may take time and resources; browser delegation is not a guarantee of instant or memory-free proving.
6. The contract address becomes active for that network immediately after submission. Wait for indexed success before claiming deployment confirmation. Copy the address and inspect the linked network explorer.
7. Give the guest **only** the invitation secret, its issued clearance, contract address and network. Never give them the admin backup.

An indexer timeout is not proof that submission failed. Use **Check confirmation again**, the explorer, and the registry before retrying a transaction.

### Publish a shared frontend

For a Vercel deployment, use `frontend` as the project root; `vercel.json` is included. The root `netlify.toml` also supports a Netlify build. Set public build variables:

```dotenv
VITE_NETWORK=preprod
VITE_PREPROD_CONTRACT_ADDRESS=<your actual new Preprod address>
```

The address can also be set in the app without a rebuild. Browser-selected addresses are namespaced by network and take precedence over build configuration. Local storage belongs only to that browser; setting it does **not** update every visitor’s default. Set the environment variable before publishing your shared demo.

## Use an invitation and check the result

1. Open **Your invitation** (`/prove`), select the correct network and gate, and connect a wallet.
2. Enter the 64-hex-character invitation secret and the **exact issued clearance**. The clearance is cryptographically bound into the invitation; increasing it yourself invalidates the proof.
3. Submit the invitation. Private fields are cleared as proving begins. If the wallet rejects or proving fails before submission, enter the credentials again.
4. Wait for indexed success and public badge membership. Download the confirmed receipt.
5. Open **Registry** (`/registry`) with the same network and address; anyone can inspect policy and look up the public badge without a wallet.
6. An organizer can rotate the invitation for the next guest, update policy or pause/resume the gate using the admin secret.

**MVP scope:** one active invitation commitment per contract, not a large Merkle-tree allowlist. One secret can redeem once. Rotation preserves previous nullifiers, badges and admission count. Capacity is the lifetime number of admissions, not the size of a stored guest list.

## Privacy model

### Public state vs private witness

| Value | Visibility and purpose |
|---|---|
| `gate_name`, `allowlist_root` | Public gate label and current invitation commitment |
| `minimum_clearance`, `max_entries`, `is_open` | Public access policy |
| `verified_entries` | Public lifetime admission count |
| `nullifiers` | Public deterministic hashes for replay prevention |
| `badge_registry` | Public admission commitments for receipt lookup |
| `admin_public_key` | Public hash authenticating the admin witness |
| `member_secret()` | Private 32-byte invitation witness |
| `member_clearance()` | Private issued clearance witness, bound to the secret |
| `admin_secret()` | Private authorization witness for policy operations |

`disclose()` is used deliberately for policy, the nullifier, badge and count—not the raw witness values. An observer can see admission activity, the policy, registry entries and transaction timing. The proof does not publish the invitation preimage, exact clearance or administrator preimage.

### Important limits

- **No anonymity guarantee:** fee/payment metadata, timing, reused secrets and network services can correlate activity. No absence of `msg.sender` should be interpreted as blanket unlinkability.
- **Trusted prover boundary:** the browser/wallet and a configured proof server may process witness data. Zero-knowledge protects the on-chain verification boundary, not every device or service involved in generating the proof.
- **Bearer invitation:** someone who copies the secret and clearance can race the intended guest. It is not proof of unique human identity.
- **Badge semantics:** membership in the registry is publicly checkable. A copied receipt does not establish ownership or the presenter’s identity.
- **Cross-gate linking:** nullifiers are deterministic from the secret. Never reuse invitation secrets across contracts.
- **Issuer trust:** the organizer issues credentials and may know who received them; Cairn does not conceal that knowledge from the organizer.
- **Local state:** witnesses are held in session memory and cleared on operation cleanup/disconnect. Strings in browser memory cannot be guaranteed to be physically zeroized. Backups are unencrypted files under your control.
- **Admin authority:** administrators can change policy and pause admissions. The MVP does not rotate the administrator commitment; keep its secret secure. The separately backed-up maintenance key has contract-maintenance authority and is not the day-to-day admin witness.

See [security](SECURITY.md) and the [contract specification](contracts/README.md).

## Contract API

| Circuit | Public arguments | Private witnesses |
|---|---|---|
| `prove_access` | `badge_commitment` | member secret and issued clearance |
| `update_gate` | next commitment, minimum clearance, capacity | admin secret |
| `set_gate_open` | open/closed flag | admin secret |

Constructor: gate name (`Bytes<32>`), invite commitment (`Bytes<32>`), minimum (`Uint<8>`), capacity (`Uint<32>`), admin hash (`Bytes<32>`). Browser arguments match the generated `initialState` signature; numeric arguments use `bigint`.

<a id="hackathon-progression-levels-1-4"></a>

## Hackathon Progression (Levels 1–4)

### Level 1: Setup and first contract

The Compact contract, generated proving artifacts, application structure, and documented product proposal are included in the repository.

### Level 2: Frontend integration

The React frontend integrates Midnight wallet connectors, network selection, contract deployment, invitation proving, administrator operations, and public registry reads.

### Level 3: Verification and production-grade workflow

Automated contract and application tests, TypeScript validation, browser checks, and GitHub Actions CI/CD are included. The verification screenshots are included below.

### Level 4: Live MVP

The frontend is deployed at [cairn-green-nu.vercel.app](https://cairn-green-nu.vercel.app/), with the Preprod contract address and transaction listed in [Official Submission Links](#official-submission-links).

## Project Showcase & Verification Proofs

The following screenshots document the deployed interface and automated verification workflow.

### User Interface Showcase

See the five interface screenshots above for the Admin, invitation, registry, and responsive application views.

### Tests and CI/CD

```bash
npm test                         # 25 offline generated-contract tests
npm run test:app                 # browser integration utilities
npm run check                    # backend/scripts TypeScript
npm run build                    # frontend TypeScript + Vite production build
npm exec --prefix frontend -- playwright install chromium
npm run test:e2e --prefix frontend
```

Tests cover valid admission, invalid secret, clearance tampering, insufficient clearance, replay, gate capacity, duplicate badge, authenticated policy changes, pause/resume, witness privacy boundaries, byte validation, network separation and session cleanup. Browser checks cover themes, responsive routes, accessibility, secure backup gating, wallet absence and address configuration.

`.github/workflows/ci.yaml` installs Node 22 and Compact, regenerates real keys, tests and builds on push and pull request. Hosted static deployment is configured through Vercel/Netlify; attach your repository and hosting project to activate continuous deployment. No deployment credentials are embedded.

Optional integration tests spend test-network resources and require the services and wallet configuration described in [setup](docs/SETUP.md). They are **not** disguised as offline test successes.

## Project map

```text
contracts/          Compact source, witnesses, generated circuits and keys
frontend/src/       React routes, wallet context, typed Midnight adapter
frontend/public/    Local images, favicon and served proving assets
frontend/tests/     Playwright browser and accessibility checks
src/                Node wallet/provider setup and contract tests
scripts/            Compile, artifact sync and optional CLI deployment tools
.github/workflows/  Verification and dependency scanning
docs/               Setup, usage, architecture, validation and level evidence
```

## Levels 1–4

The implementation supports the requested levels. The complete requirement-by-requirement review is in [docs/LEVELS.md](docs/LEVELS.md). In addition to deployment, UI screenshots, repository setup and meaningful commits, the submission includes a **live demo, demo video and hosted passing CI run**.

[Product proposal](PROPOSAL.md) · [Usage guide](docs/USAGE.md) · [Architecture](docs/ARCHITECTURE.md) · [Local validation](docs/VALIDATION.md)

<a id="contributing-security-and-license"></a>

## Contributing, Security, and License

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
- Report security concerns according to [SECURITY.md](SECURITY.md).
- This project is distributed under the [Apache License 2.0](LICENSE).

## Assets and license

The application uses self-hosted Manrope and Bricolage Grotesque, Lucide icons, and locally served landscape imagery. Source and licensing notes are in `docs/ASSETS.md`. The source license is in `LICENSE` (Apache License 2.0); applicable third-party notices remain intact.
