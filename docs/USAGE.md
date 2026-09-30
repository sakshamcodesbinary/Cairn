# Using Cairn

## Host: create a gate

1. Select Preview for exploration or Preprod for the launch submission.
2. Connect a compatible Midnight wallet and confirm its network and DUST balance.
3. Open Admin. Name the gate; the name is public and limited to 32 UTF-8 bytes.
4. Choose minimum clearance (0–255), issued clearance (at least that minimum), and positive lifetime capacity.
5. Generate independent random member/admin credentials and a maintenance signing key.
6. Download the private admin backup and store it securely. The file is unencrypted. Acknowledge that Cairn cannot recover it.
7. Deploy and approve the wallet request. Wait for indexed success.
8. Save the address and network. Share only the invitation secret and its issued clearance with the guest.

The initial backup deliberately contains admin credentials and must never be sent to a guest. Copy only the member fields into a separate secure message. Invitation rotations offer a separate member-only invitation download.

## Guest: prove an invitation

1. Open Your invitation. Check the network and contract address against the host’s message.
2. Connect a wallet, enter the exact secret and issued clearance.
3. The application generates a fresh public badge commitment.
4. Submit; private fields clear as the operation starts.
5. Confirm in the wallet and wait for indexed success and visible badge membership.
6. Download the public receipt. It contains the contract, network, badge, transaction identifier, transaction hash and indexed block height—not your invitation secret.

A failed proof is not an invitation approval. A submitted transaction is not yet an indexed success. If a timeout follows submission, retry confirmation rather than submitting the invitation again.

## Verifier: inspect a receipt

Open Registry, select the network, enter the gate address and read the ledger. Paste the public badge commitment to check membership against a fresh snapshot. The timestamp describes when that snapshot was read, not a continuously subscribed state.

A badge is public and copyable. Presence proves registration; it does not prove that the presenter owns an identity or is the original guest.

## Host: administer

Enter a gate address and the private admin secret in the management panel.

- **Update policy:** applies the minimum/capacity fields while retaining the current invitation commitment. Raising the minimum may invalidate the current invitation.
- **Pause / resume:** toggles admission availability.
- **Rotate invitation:** generates a fresh member secret, binds its issued clearance, requires a secure member-only backup, and replaces the active commitment. It also applies the current policy fields.

The capacity cannot be set below the admission count. Rotation does not reset the count, nullifiers or badges. Reusing an already redeemed secret still fails. Admin witness inputs clear after an admin operation.

## Disconnect, reload and change network

Disconnect removes the app’s local wallet session and clears its in-memory witnesses. Connector 4.x does not expose an extension-level disconnect method; revoke the site in wallet settings if you need to remove authorization there too.

Changing network disconnects the session and clears private form values. Addresses remain separate by network. Reloading loses unsaved private credentials; recover them only from your secure offline backup.

## Common failures

| Failure | Action |
|---|---|
| No wallet detected | Install/unlock a supported Midnight connector; retry |
| Outdated connector | Update the extension; wallet-assisted proving is required |
| Network mismatch | Match app and wallet, then reconnect |
| Missing proving assets | Recompile and publish both keys and ZKIR |
| Wrong secret / inflated clearance | Re-enter the exact host-issued pair |
| Replay / duplicate badge | Do not reuse a redeemed invitation; ask the host for a fresh one |
| Gate paused / full | Ask the host to resume or raise capacity |
| Indexer timeout | Inspect explorer and retry confirmation, not the transaction |
| Clipboard blocked | Select the displayed value and copy manually |
| Browser storage blocked | Keep the address yourself; it is active only in session memory |
