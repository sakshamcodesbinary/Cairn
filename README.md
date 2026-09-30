# Cairn — Private Invitation Access on Midnight

> **Leave a proof. Not a profile.**

Cairn is a privacy-preserving disaster relief and invitation eligibility dApp built on the Midnight Network using Compact zero-knowledge smart contracts, React 19, TypeScript, Vite, and 1AM / Lace wallet integration.

A member proves that an issued invitation is valid and meets a public clearance policy without putting the invitation secret, exact clearance, or administrator credentials on the public ledger.

---

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node->=%2022.0.0-brightgreen.svg)](package.json)
[![Compact Compiler](https://img.shields.io/badge/compact-0.31.1-purple.svg)](contracts/README.md)
[![Midnight Network](https://img.shields.io/badge/midnight-preprod%20%7C%20preview-navy.svg)](https://midnight.network)
[![Build & Test](https://github.com/sakshamcodesbinary/Cairn/actions/workflows/ci.yaml/badge.svg)](https://github.com/sakshamcodesbinary/Cairn/actions)

---

## 👨‍💻 Maintainer & Author

**Saksham Singh**
- GitHub: [@sakshamcodesbinary](https://github.com/sakshamcodesbinary)
- Repository: [sakshamcodesbinary/Cairn](https://github.com/sakshamcodesbinary/Cairn)

---

## 🌐 Live Deployment & Contract Information

- **Live Deployment Web App**: `[Deployment Link - Pending]`
- **Midnight Preprod Contract Address**: `[Contract Address - Pending]`
- **Deployment Transaction**: `[Transaction Hash - Pending]`
- **Midnight Explorer**: [1AM Explorer](https://explorer.1am.xyz/)

---

## 📽️ Demo Video

🎬 **[Watch Full Product Demo Video on Google Drive](https://drive.google.com/file/d/1GFFPuCnS3hPzLzz9S3uNuiRTQmQwGvWy/view?usp=sharing)**

---

## 🎨 User Interface Showcase

![User Interface Screenshot 1](https://github.com/user-attachments/assets/dc378ef8-09ee-479c-bbd2-8531e65dbdb4)

![User Interface Screenshot 2](https://github.com/user-attachments/assets/4b12c775-d071-415f-82e3-0ce5a7ddd15a)

![User Interface Screenshot 3](https://github.com/user-attachments/assets/4346897f-77d9-47f8-b9ab-777fcff97e36)

![User Interface Screenshot 4](https://github.com/user-attachments/assets/3e8ed60b-5bff-40a6-9a8e-76aa1b906c05)

![User Interface Screenshot 5](https://github.com/user-attachments/assets/e0dec9f7-2c81-4ae5-845b-8cd9ae69e87a)

---

## 🧪 Verification & Execution Proofs

### CI/CD & Automated Verification Proofs
![CI/CD & Automated Verification Proof](https://github.com/user-attachments/assets/b599eced-ac8e-4624-8a3b-2db52fe37ec8)

### Npm Run Dev Proofs
![Npm Run Dev Proof](https://github.com/user-attachments/assets/0190ee44-deef-4829-8f24-1e7cd3143281)

### Npm Run Tests Proofs
![Npm Run Tests Proof](https://github.com/user-attachments/assets/03e10eda-12d6-4455-96aa-42a422beae53)

---

## 💡 Key Features & Capabilities

- **Compact 0.31.1 ZK Smart Contract**: Compiled circuit bindings with explicit member and administrator witnesses, domain-separated commitments, single-use replay protection, unique badges, and capacity checks.
- **Midnight Wallet Integration**: Connector discovery, network guards, and wallet-assisted proving supporting Midnight Lace, 1AM, and Nightly connectors.
- **Zero-Knowledge Privacy Guarantee**: Zero raw witness values published on-chain. Proves eligibility and clearance without leaking private credentials.
- **Public Registry & Verification**: Wallet-free public ledger reads, badge lookups, and deterministic nullifier replay checks.
- **Administrator Governance**: Administrator policy updates, invitation rotation, gate pause/resume, and secure offline admin backup generation.
- **Modern Alpine Visual Identity**: Custom design system with light/dark theme persistence, responsive layouts, keyboard navigation, and self-hosted typography.

---

## 🔒 Privacy Model

### Public Ledger State vs Private Witness

| Field | Type | Visibility & Purpose |
|---|---|---|
| `gate_name`, `allowlist_root` | Public Ledger | Public gate label and active invitation commitment |
| `minimum_clearance`, `max_entries`, `is_open` | Public Ledger | Public access policy parameters |
| `verified_entries` | Public Ledger | Public lifetime admission counter |
| `nullifiers` | Public Ledger | Deterministic hash set for replay prevention |
| `badge_registry` | Public Ledger | Public admission commitments for verification |
| `admin_public_key` | Public Ledger | Public hash authenticating administrator witness |
| `member_secret()` | Private Witness | 32-byte secret invitation credential |
| `member_clearance()` | Private Witness | Issued clearance level bound to member secret |
| `admin_secret()` | Private Witness | Authorization witness for policy changes |

---

## ⚡ Contract API Reference

| Circuit | Public Arguments | Private Witnesses |
|---|---|---|
| `prove_access` | `badge_commitment` | `member_secret`, `member_clearance` |
| `update_gate` | `new_root`, `new_min`, `new_max` | `admin_secret` |
| `set_gate_open` | `open_state` | `admin_secret` |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `>= 22.0.0`
- **Package Manager**: `npm`
- **Compact Compiler**: `0.31.1`

### Installation & Run Commands

```bash
# Install root and frontend dependencies
npm ci
npm ci --prefix frontend

# Compile Compact smart contracts and synchronize circuit artifacts
npm run compile

# Run type check and test suites
npm run check
npm test
npm run test:app

# Build production web application
npm run build

# Start local frontend development server
npm run dev --prefix frontend
```

---

## 📁 Repository Structure

```text
contracts/          Compact source code, witness specifications, and generated ZK keys
frontend/src/       React 19 pages, wallet context, UI components, and Midnight adapter
frontend/public/    Proving assets, local fonts, and static resources
frontend/tests/     Playwright E2E browser and accessibility tests
scripts/            Compact compilation, artifact synchronization, and CLI deployment tools
src/                Node adapter, providers, and generated-contract unit tests
.github/workflows/  GitHub Actions CI/CD automated build and test pipeline
docs/               Architecture, setup, usage guides, and validation reports
```

---

## 📄 License & Community Standards

This project is open-source and released under the **[Apache License 2.0](LICENSE)**.

- **Author**: **Saksham Singh** ([@sakshamcodesbinary](https://github.com/sakshamcodesbinary))
- **[Code of Conduct](CODE_OF_CONDUCT.md)**: Community interaction and participation guidelines.
- **[Security Policy](SECURITY.md)**: Security boundaries and vulnerability reporting procedures.
- **[Contributing Guide](CONTRIBUTING.md)**: Contribution guidelines and development workflow.
