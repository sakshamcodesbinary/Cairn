import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { Link } from 'react-router-dom';
import { EXPLORER_URLS, MAX_GATE_ENTRIES, MINIMUM_CLEARANCE, NETWORKS, type MidnightNetwork } from '../config';
import { useWallet } from '../contexts/WalletContext';
import { bytesToHex, hexToBytes, randomBytes32, textToBytes32 } from '../lib/bytes';
import { callGate, deployGate, downloadJson, emptyPrivateState, parseInteger, pureCircuits, readGate, validateAddress, waitForConfirmation, type IndexedReceipt } from '../lib/contract';
import { useClearSecrets, useContractAddress } from '../lib/hooks';

export default function AdminPage() {
  const { session, network, setNetwork, isConnecting, connect, error: walletError } = useWallet();
  const { address, setAddress, saveAddress } = useContractAddress(network);
  const [gateName, setGateName] = useState('');
  const [memberSecret, setMemberSecret] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [signingKey, setSigningKey] = useState('');
  const [issuedClearance, setIssuedClearance] = useState('2');
  const [minimum, setMinimum] = useState(String(MINIMUM_CLEARANCE));
  const [maximum, setMaximum] = useState(String(MAX_GATE_ENTRIES));
  const [downloaded, setDownloaded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [authSecret, setAuthSecret] = useState('');
  const [rotationSecret, setRotationSecret] = useState('');
  const [rotationClearance, setRotationClearance] = useState('2');
  const [rotationDownloaded, setRotationDownloaded] = useState(false);
  const [rotationAcknowledged, setRotationAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ address: string; txId: string; network: MidnightNetwork; queryUrl: string } | null>(null);
  const [receipt, setReceipt] = useState<IndexedReceipt | null>(null);
  const operation = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const clearSecrets = useCallback(() => {
    setMemberSecret(''); setAdminSecret(''); setSigningKey(''); setAuthSecret(''); setRotationSecret('');
    setDownloaded(false); setAcknowledged(false); setRotationDownloaded(false); setRotationAcknowledged(false);
    operation.current?.abort();
  }, []);
  useClearSecrets(clearSecrets);
  useEffect(() => { setSubmitted(null); setReceipt(null); setStatus(''); setError(null); }, [network]);
  useEffect(() => () => operation.current?.abort(), []);
  const fail = (reason: unknown) => setError(reason instanceof Error ? reason.message : 'The operation could not be completed.');
  const invalidateBackup = () => { setDownloaded(false); setAcknowledged(false); };
  const generate = () => {
    setMemberSecret(bytesToHex(randomBytes32())); setAdminSecret(bytesToHex(randomBytes32())); setSigningKey(sampleSigningKey()); invalidateBackup();
  };
  const backup = () => {
    try {
      hexToBytes(memberSecret); hexToBytes(adminSecret);
      if (!signingKey) throw new Error('Generate credentials first.');
      const clearance = parseInteger(issuedClearance, 'Issued clearance', 0n, 255n);
      downloadJson('cairn-admin-backup.json', { product: 'Cairn', version: 1, network, gateName, memberSecret, issuedClearance: clearance.toString(), adminSecret, maintenanceSigningKey: signingKey, warning: 'PRIVATE ADMIN BACKUP. Never share this file. Store offline securely.' });
      setDownloaded(true); setError(null);
    } catch (reason) { fail(reason); }
  };
  const confirm = async (submission: NonNullable<typeof submitted>, signal: AbortSignal) => {
    setStatus('Submitted to the network. Waiting for indexed confirmation…');
    const result = await waitForConfirmation(submission.queryUrl, submission.txId, signal);
    if (!signal.aborted) { setReceipt(result); setStatus(`Indexed successfully in block ${result.blockHeight}.`); }
  };
  const run = async (action: (signal: AbortSignal) => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); setReceipt(null);
    const controller = new AbortController(); operation.current = controller;
    try { await action(controller.signal); }
    catch (reason) { if (!controller.signal.aborted) fail(reason); }
    finally { lock.current = false; setBusy(false); }
  };
  const handleDeploy = (event: FormEvent) => {
    event.preventDefault();
    void run(async (signal) => {
      if (!session) throw new Error(`Connect a wallet on ${network} first.`);
      if (!downloaded || !acknowledged) throw new Error('Download the private backup and acknowledge secure storage before deploying.');
      const min = parseInteger(minimum, 'Minimum clearance', 0n, 255n);
      const max = parseInteger(maximum, 'Capacity', 1n, 4_294_967_295n);
      const issued = parseInteger(issuedClearance, 'Issued clearance', 0n, 255n);
      if (issued < min) throw new Error('The invitation clearance is below the minimum. Adjust the policy or issued clearance.');
      const member = hexToBytes(memberSecret); const admin = hexToBytes(adminSecret);
      setSubmitted(null); setStatus('Checking contract assets, creating deployment, and requesting wallet approval…');
      try {
        const result = await deployGate(session, network, { name: textToBytes32(gateName), root: pureCircuits.derive_member_key(member, issued), minimum: min, maximum: max, adminKey: pureCircuits.derive_admin_key(admin), signingKey });
        // Store immediately on submission, not on a potentially delayed indexer response.
        const persisted = saveAddress(result.address);
        const submission = { ...result, network, queryUrl: session.config.indexerUri };
        if (signal.aborted) return;
        setAddress(result.address); setSubmitted(submission);
        setMemberSecret(''); setAdminSecret(''); setSigningKey(''); invalidateBackup();
        if (!persisted) setError('Address is available for this session, but browser storage is blocked. Copy it before leaving.');
        await confirm(submission, signal);
      } finally { member.fill(0); admin.fill(0); }
    });
  };
  const manage = (action: 'policy' | 'rotate' | 'pause' | 'resume') => void run(async (signal) => {
    if (!session) throw new Error(`Connect a wallet on ${network} first.`);
    const target = validateAddress(address);
    if (action === 'rotate' && (!rotationDownloaded || !rotationAcknowledged)) throw new Error('Download and securely save the new invitation before rotating.');
    const state = emptyPrivateState(); state.adminSecret = hexToBytes(authSecret);
    setSubmitted(null); setStatus('Preparing authenticated admin transaction…');
    let txId: string;
    try {
      if (action === 'pause' || action === 'resume') {
        txId = await callGate(session, network, target, state, { circuit: 'set_gate_open', args: [action === 'resume'] });
      } else {
        const min = parseInteger(minimum, 'Minimum clearance', 0n, 255n);
        const max = parseInteger(maximum, 'Capacity', 1n, 4_294_967_295n);
        const current = await readGate(target, network, signal);
        if (max < current.verified_entries) throw new Error('Capacity cannot be less than already verified entries.');
        let root = current.allowlist_root;
        if (action === 'rotate') {
          const clearance = parseInteger(rotationClearance, 'Issued clearance', 0n, 255n);
          if (clearance < min) throw new Error('New invitation clearance is below the minimum.');
          const secret = hexToBytes(rotationSecret);
          try { root = pureCircuits.derive_member_key(secret, clearance); } finally { secret.fill(0); }
        }
        txId = await callGate(session, network, target, state, { circuit: 'update_gate', args: [root, min, max] });
      }
    } finally { state.adminSecret.fill(0); setAuthSecret(''); }
    const submission = { address: target, txId, network, queryUrl: session.config.indexerUri };
    if (signal.aborted) return;
    setSubmitted(submission);
    if (action === 'rotate') { setRotationSecret(''); setRotationDownloaded(false); setRotationAcknowledged(false); }
    await confirm(submission, signal);
  });
  const downloadRotation = () => {
    try {
      hexToBytes(rotationSecret);
      const clearance = parseInteger(rotationClearance, 'Issued clearance', 0n, 255n);
      downloadJson('cairn-invitation.json', { product: 'Cairn', version: 1, network, contractAddress: validateAddress(address), memberSecret: rotationSecret, memberClearance: clearance.toString(), warning: 'Private, single-use invitation. Keep confidential. Valid only after the rotation is confirmed.' });
      setRotationDownloaded(true); setError(null);
    } catch (reason) { fail(reason); }
  };
  return <div className="page-shell working-page">
    <header className="page-heading"><p className="eyebrow">The host desk</p><h1>A considered way in.</h1><p>Deploy a private invitation gate, then control its policy. Your admin secret stays out of the public ledger.</p></header>
    <section className="surface panel stack">
      <div className="two-column"><label className="field">Network<select className="input" value={network} disabled={busy || isConnecting} onChange={(event) => setNetwork(event.target.value as MidnightNetwork)}><option value="preview">Preview</option><option value="preprod">Preprod</option></select></label><div className="stack"><span>Wallet</span>{session ? <p>Connected on {NETWORKS[network].label}</p> : <button className="button button-primary" disabled={isConnecting} onClick={() => void connect()}>{isConnecting ? 'Connecting…' : 'Connect wallet'}</button>}</div></div>
      <p className="muted">Test networks only. Your wallet must have sufficient DUST to pay transaction fees. Proofs are delegated to your wallet’s configured proving service, which may receive private witness data.</p>
      {walletError && <p className="alert" role="alert">{walletError}</p>}
    </section>
    <div className="two-column">
      <form className="surface panel stack" onSubmit={handleDeploy}>
        <p className="eyebrow">Create</p><h2>Open a new gate</h2>
        <label className="field">Gate name<input className="input" required value={gateName} disabled={busy} placeholder="A name for your gathering" onChange={(event) => { setGateName(event.target.value); invalidateBackup(); }} /><small>1–32 UTF-8 bytes. This name is public.</small></label>
        <div className="two-column"><label className="field">Minimum clearance<input className="input" type="number" min="0" max="255" required disabled={busy} value={minimum} onChange={(event) => setMinimum(event.target.value)} /></label><label className="field">Gate capacity<input className="input" type="number" min="1" max="4294967295" required disabled={busy} value={maximum} onChange={(event) => setMaximum(event.target.value)} /></label></div>
        <label className="field">Invitation’s issued clearance<input className="input" type="number" min="0" max="255" required disabled={busy} value={issuedClearance} onChange={(event) => { setIssuedClearance(event.target.value); invalidateBackup(); }} /><small>Bound cryptographically to this invitation, independently of the minimum policy.</small></label>
        <button className="button" type="button" disabled={busy} onClick={generate}>{memberSecret ? 'Regenerate credentials' : 'Generate secure credentials'}</button>
        <label className="field">Invitation secret<input className="input" type="password" autoComplete="off" readOnly value={memberSecret} placeholder="Generate above" /></label>
        <label className="field">Admin secret<input className="input" type="password" autoComplete="off" readOnly value={adminSecret} placeholder="Generate above" /></label>
        <p className="muted">One active invitation commitment, one redemption per secret. Rotating invites does not reset nullifiers or existing badges. Never share the admin backup; send only the invitation secret and its issued clearance to the guest.</p>
        <button className="button" type="button" disabled={busy || !memberSecret} onClick={backup}>Download private admin backup</button>
        <label className="checkbox-field"><input type="checkbox" disabled={!downloaded || busy} checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /> I saved this unencrypted backup securely. Cairn cannot recover it.</label>
        <button className="button button-primary" disabled={busy || !session || !acknowledged} type="submit">{busy ? 'Transaction in progress…' : 'Deploy gate'}</button>
      </form>
      <section className="surface panel stack">
        <p className="eyebrow">Steward</p><h2>Manage a gate</h2>
        <label className="field">Contract address<input className="input mono" spellCheck={false} value={address} disabled={busy} placeholder="64 hexadecimal characters" onChange={(event) => setAddress(event.target.value)} /></label>
        <button className="button" disabled={busy} onClick={() => { try { validateAddress(address); if (!saveAddress(address)) throw new Error('Saved for this session only. Browser storage is blocked.'); setStatus('Gate address saved for this network.'); setError(null); } catch (reason) { fail(reason); } }}>Use this gate</button>
        <label className="field">Admin secret<input className="input" type="password" autoComplete="off" spellCheck={false} disabled={busy} value={authSecret} onChange={(event) => setAuthSecret(event.target.value)} placeholder="From your private backup" /><small>Private witness; cleared after each admin transaction.</small></label>
        <p className="muted">Policy updates use the minimum clearance and capacity fields in the create panel, keeping the current invitation commitment. Raising clearance may make that invitation ineligible.</p>
        <button className="button" disabled={busy || !session} onClick={() => manage('policy')}>Update policy</button>
        <div className="button-row"><button className="button" disabled={busy || !session} onClick={() => manage('pause')}>Pause gate</button><button className="button" disabled={busy || !session} onClick={() => manage('resume')}>Resume gate</button></div>
        <h3>Rotate the invitation</h3><p className="muted">Replaces the active commitment, invalidating the previous unredeemed invitation. Also applies the policy fields above.</p>
        <button className="button" disabled={busy} onClick={() => { setRotationSecret(bytesToHex(randomBytes32())); setRotationDownloaded(false); setRotationAcknowledged(false); }}>Generate new invitation</button>
        <label className="field">New invitation secret<input className="input" type="password" autoComplete="off" readOnly value={rotationSecret} /></label>
        <label className="field">New issued clearance<input className="input" type="number" min="0" max="255" disabled={busy} value={rotationClearance} onChange={(event) => { setRotationClearance(event.target.value); setRotationDownloaded(false); setRotationAcknowledged(false); }} /></label>
        <button className="button" disabled={busy || !rotationSecret} onClick={downloadRotation}>Download new invitation</button>
        <label className="checkbox-field"><input type="checkbox" disabled={busy || !rotationDownloaded} checked={rotationAcknowledged} onChange={(event) => setRotationAcknowledged(event.target.checked)} /> I saved the new invitation securely.</label>
        <button className="button button-primary" disabled={busy || !session || !rotationAcknowledged} onClick={() => manage('rotate')}>Rotate invitation &amp; apply policy</button>
      </section>
    </div>
    {(status || error || submitted) && <section className="surface panel stack" aria-live="polite"><h2>Transaction journal</h2>{status && <p role="status">{status}</p>}{error && <p className="alert" role="alert">{error}</p>}{submitted && <><p>{receipt ? 'Indexed confirmation' : 'Submitted · confirmation pending'} · {NETWORKS[submitted.network].label}</p><label className="field">Contract address<code className="code-block">{submitted.address}</code></label><label className="field">Transaction ID<code className="code-block">{submitted.txId}</code></label><div className="button-row"><button className="button" onClick={async () => { try { await navigator.clipboard.writeText(submitted.address); setStatus('Contract address copied.'); } catch { setError('Clipboard access failed. Select and copy the address manually.'); } }}>Copy address</button><a className="button" href={`${EXPLORER_URLS[submitted.network]}${submitted.address}`} target="_blank" rel="noreferrer">Open explorer ↗</a>{!receipt && <button className="button" disabled={busy} onClick={() => void run((signal) => confirm(submitted, signal))}>Check confirmation again</button>}</div>{receipt && <button className="button" onClick={() => downloadJson('cairn-admin-receipt.json', { ...receipt, contractAddress: submitted.address, network: submitted.network })}>Download receipt</button>}<Link className="text-link" to="/registry">Read public registry →</Link></>}</section>}
  </div>;
}
