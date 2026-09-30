# Cairn — product proposal

**Provided idea:** Private Allowlist Access

**Approval status:** Draft prepared for submission. No approval has been claimed.

## Problem

An invitation-only research circle or small event should be able to verify an invitation without turning every visit into a public identity record. Conventional registration forms collect unnecessary personal information, while transparent on-chain guest lists make membership directly observable.

## Proposed experience

An organizer deploys a gate, generates a random invitation secret and binds its issued clearance into a public commitment. The guest proves knowledge of that credential and satisfaction of the public threshold with a Compact circuit. The contract publishes a replay-resistant nullifier and a badge, allowing anyone to check admission without receiving the original credential.

## Why Midnight

The application needs a public policy and auditable admission count alongside private credential checks. Midnight’s explicit ledger/witness boundary and `disclose()` allow exactly those outcomes to become public. The credential itself is not a ledger field or public transaction argument.

## MVP scope

- One active invitation commitment at a time; organizer rotates to the next guest.
- Browser deployment on Preview and Preprod.
- Witness-backed admission, threshold check, capacity, replay and duplicate-badge protection.
- Admin-authenticated policy updates and pause/resume.
- Public badge registry, wallet-free reads, downloadable confirmed receipts.
- Accessible responsive frontend with day/night mode, unit tests and CI.

## Non-goals

No Merkle-tree bulk membership, real-world identity verification, nontransferable badge ownership, automatic door/hardware integration, administrator-key recovery, full transaction anonymity or production security certification. The invitation is a bearer credential and the organizer remains trusted to issue it appropriately.

## Acceptance criteria

1. A funded Preprod wallet deploys and the address is visible on the explorer.
2. A correctly issued invitation registers exactly once.
3. Invalid secrets, inflated clearance, low clearance, full/paused gates and unauthorized admin operations fail.
4. The registry can confirm a badge without a wallet or the invitation secret.
5. Policy and public outputs are documented separately from private witnesses.
6. Automated verification runs in the product’s hosted repository.

## Next iteration

A reviewed Merkle membership design, contract-specific nullifier domains, nontransferable presentation proofs where appropriate, multi-issuer policy, and encrypted recoverable operator backups. These are proposals—not current capabilities.
