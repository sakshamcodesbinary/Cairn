# Cairn security policy

Cairn is an experimental Preview/Preprod MVP. Do not use production credentials or treat this code as an independently audited access-control system.

## Trust boundaries

- The organizer controls invitation issuance, threshold, capacity and open state.
- Invitations are bearer secrets. They may be stolen, shared or redeemed by a copied recipient.
- The witness secret and clearance are excluded from the public ledger; the browser, wallet and configured prover still process private data.
- A registry badge establishes membership, not identity or exclusive ownership.
- Reusing a member secret across gates links its deterministic nullifier. Generate fresh secrets for each invitation.
- A malicious browser extension, dependency, device or proving service can compromise private inputs.
- A backed-up maintenance signing key grants maintenance authority distinct from the policy admin secret. Treat both as highly sensitive.

## Storage

Contract addresses and theme preferences are public localStorage values. Witness state is session-only. Cleanup overwrites byte arrays on best effort, but JavaScript strings and wallet-internal buffers cannot be guaranteed to be erased from physical memory. Downloaded backups are unencrypted; secure them offline. Never put secrets in VITE variables, repository files, analytics, screenshots, issues or CI logs.

## Transaction safety

Check the network, gate address, constructor configuration and wallet request before approving. Browser submission is not finality. Inspect indexed success; do not blindly redeploy after a timeout. The UI makes no finality guarantee stronger than the indexer result.

## Reporting

When the owner creates the repository, enable private security advisories and publish a maintained private reporting channel here. Until then, do not post exploitable details or secrets to a public issue. No unrelated organization’s contact address is used as this product’s security desk.

## Release gate

Before production use: independent Compact review, realistic proof-service threat modeling, full funded-wallet tests, dependency audit, deployment provenance, and recovery/maintenance-key procedures are required.
