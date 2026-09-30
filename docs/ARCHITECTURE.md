# Cairn architecture

```text
Invitation / admin form
        │ session-only witness state
        ▼
CompiledContract.withWitnesses
        │ generated Compact bindings + /managed assets
        ▼
createUnprovenDeployTx / createUnprovenCallTx
        │
        ▼
Wallet proving provider → balanceUnsealedTransaction → submitTransaction
        │
        ▼
Indexer transaction result → confirmed receipt + public ledger membership
```

## Contract boundary

`contracts/cairn.compact` defines three state-changing circuits and three pure hash helpers. The five constructor inputs are public configuration. Member/admin secrets and member clearance are supplied through explicit witnesses. Clearance is part of the issued invitation commitment, so a member cannot increase the supplied value without invalidating the commitment.

The allowlist field is a single active invitation commitment. A Merkle membership claim would be misleading. The administrator rotates that commitment to issue sequential invitations. Nullifiers survive rotation and the count is lifetime admissions.

## Browser modules

- `config.ts`: network selection, public endpoints, network-scoped addresses, change events and build-time defaults.
- `WalletContext.tsx`: asynchronous wallet discovery, connection lifecycle, cancellation of stale attempts, disconnect cleanup and selected network.
- `lib/midnight.ts`: the six actual provider roles—private state, public data, ZK configuration, proof, wallet balance and transaction submission. Although often called the “five-provider pattern,” submission is a separate role in this SDK.
- `lib/contract.ts`: typed witness bindings, real artifact checks, constructor/circuit calls, strict integer validation, public reads, indexed confirmation and receipt serialization.
- `lib/hooks.ts`: reactive address changes and secret cleanup events.
- `ThemeContext.tsx`: OS default, persisted day/night setting and semantic theme tokens.

Wallet public keys may be Bech32m-encoded; the session adapter decodes them with the official address-format package. The SDK’s global network is changed only after checking the connector configuration. Guard checks also run before proving, balancing and submitting.

Connector 4.x submission returns no fabricated result. The adapter reads the genuine transaction identifier from the balanced ledger transaction and returns it after the connector submits successfully.

## State and lifecycle

Private state uses contract-scoped in-memory maps. Each call uses a fresh private-state ID and cleanup removes it in `finally`. Disconnection clears all private state and signing keys held by that session. The UI cancels confirmation polling on unmount or network change. Already submitted transactions cannot be cancelled by closing the page.

Public address storage is namespaced by product, schema version and network. It is never an authorization mechanism. An address must still resolve to the expected on-chain state. A locally selected address overrides the build-time public default for that network.

## Public reads

Registry reads use the configured public indexer without asking the wallet for permission. The latest-contract-state query avoids sending an explicit null transaction offset. Transaction confirmation queries use the transaction identifier as a typed offset and require a successful indexed status. A proof receipt also requires badge membership.

Node JSON-RPC is useful for health, version and state diagnostics, but this browser uses the SDK/indexer for application reads. A public deployment should not expose unsafe node RPC or validator administration endpoints.

## Frontend delivery

React routes for transactions and documentation are lazy-loaded. The wallet SDK is imported only when a connection or transaction page needs it; the overview does not eagerly load the ledger WASM. Manrope and Bricolage Grotesque are packaged locally. Images are local static assets. No analytics or third-party identity API is embedded.

Vite’s WASM and top-level-await plugins support the Midnight ledger. Large SDK/WASM chunks are expected and are documented in the build report rather than hidden with an inflated warning threshold.

## Tests are layered

1. Generated-contract offline tests: true Compact constraints without node/funding dependencies.
2. Adapter/config tests: byte handling, witness behavior, private-state cleanup and network isolation.
3. Playwright + axe: routes, themes, small screens, keyboard/navigation behavior, wallet absence and backup gates.
4. Opt-in network integration: real wallet/proof/node interactions; requires services and funds.

Layers 1–3 do not substitute for a live Preprod wallet demonstration or hosted CI evidence.
