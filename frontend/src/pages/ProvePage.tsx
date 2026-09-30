import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EXPLORER_URLS, NETWORKS, type MidnightNetwork } from '../config';
import { useWallet } from '../contexts/WalletContext';
import { bytesToHex, hexToBytes, randomBytes32 } from '../lib/bytes';
import { callGate, downloadJson, emptyPrivateState, parseInteger, readGate, validateAddress, waitForConfirmation, type IndexedReceipt } from '../lib/contract';
import { useClearSecrets, useContractAddress } from '../lib/hooks';

type Submission = { address: string; badge: string; txId: string; network: MidnightNetwork; queryUrl: string };
export default function ProvePage() {
  const { session, network, connect, isConnecting, error: walletError } = useWallet();
  const { address, setAddress, saveAddress } = useContractAddress(network);
  const [secret, setSecret] = useState('');
  const [clearance, setClearance] = useState('');
  const [badge, setBadge] = useState(() => bytesToHex(randomBytes32()));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [receipt, setReceipt] = useState<IndexedReceipt | null>(null);
  const operation = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const clearSecrets = useCallback(() => { setSecret(''); setClearance(''); operation.current?.abort(); }, []);
  useClearSecrets(clearSecrets);
  useEffect(() => { setSubmission(null); setReceipt(null); setError(null); setStatus(''); }, [network]);
  useEffect(() => () => operation.current?.abort(), []);
  const confirm = async (sent: Submission, signal: AbortSignal) => {
    setStatus('Submitted. Waiting for indexed confirmation; access is not yet confirmed.');
    const result = await waitForConfirmation(sent.queryUrl, sent.txId, signal);
    const gate = await readGate(sent.address, sent.network, signal);
    if (!gate.badge_registry.member(hexToBytes(sent.badge))) throw new Error('Transaction was indexed, but the badge is not yet visible in the configured registry. Check confirmation again.');
    if (!signal.aborted) { setReceipt(result); setStatus('Confirmed. Your badge commitment is present in the public registry.'); }
  };
  const run = async (action: (signal: AbortSignal) => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    const controller = new AbortController(); operation.current = controller;
    try { await action(controller.signal); }
    catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Proof or transaction failed.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void run(async (signal) => {
      if (!session) throw new Error(`Connect your wallet on ${network} before proving.`);
      const target = validateAddress(address);
      const memberClearance = parseInteger(clearance, 'Issued clearance', 0n, 255n);
      const commitment = hexToBytes(badge);
      const memberSecret = hexToBytes(secret);
      const state = { ...emptyPrivateState(), memberSecret, memberClearance };
      setSecret(''); setClearance(''); setReceipt(null); setSubmission(null);
      setStatus('Checking circuit artifacts, generating a real proof, and requesting wallet approval…');
      const txId = await callGate(session, network, target, state, { circuit: 'prove_access', args: [commitment] });
      saveAddress(target);
      if (signal.aborted) return;
      const sent = { address: target, badge, txId, network, queryUrl: session.config.indexerUri };
      setSubmission(sent);
      await confirm(sent, signal);
    });
  };
  return <div className="page-shell working-page">
    <header className="page-heading"><p className="eyebrow">The private entrance</p><h1>Your invitation. Nothing more.</h1><p>Prove that your invitation meets the gate’s policy, without publishing the invitation secret or its clearance.</p></header>
    <div className="two-column">
      <form className="surface panel stack" onSubmit={submit}>
        <div className="section-title"><h2>Present your invitation</h2><span className="network-pill">{NETWORKS[network].label}</span></div>
        <label className="field">Gate contract address<input className="input mono" value={address} required disabled={busy} spellCheck={false} autoComplete="off" placeholder="64 hexadecimal characters" onChange={(event) => setAddress(event.target.value)} /></label>
        <label className="field">Invitation secret<input className="input" type="password" value={secret} required disabled={busy} spellCheck={false} autoComplete="off" placeholder="Private secret from your host" onChange={(event) => setSecret(event.target.value)} /><small>32 bytes, represented as 64 hexadecimal characters. Never paste an admin secret here.</small></label>
        <label className="field">Issued clearance<input className="input" type="password" inputMode="numeric" value={clearance} required disabled={busy} autoComplete="off" placeholder="The value supplied with your invitation" onChange={(event) => setClearance(event.target.value)} /><small>Use the exact issued value (0–255). Increasing it yourself invalidates the invitation.</small></label>
        <label className="field">Public badge commitment<code className="code-block">{badge}</code><small>A fresh random 32-byte identifier. This commitment will be public; it is not your invitation secret.</small></label>
        {!session ? <button className="button button-primary" type="button" disabled={isConnecting} onClick={() => void connect()}>{isConnecting ? 'Connecting…' : 'Connect wallet to continue'}</button> : <button className="button button-primary" type="submit" disabled={busy || Boolean(submission)}>{busy ? 'Proof / transaction in progress…' : submission ? 'Invitation submitted' : 'Prove & submit invitation'}</button>}
        {walletError && <p className="alert" role="alert">{walletError}</p>}
        <p className="muted">The form clears private values when proving begins. If proving fails before submission, enter them again. Wallet rejection and insufficient DUST are surfaced, not simulated.</p>
      </form>
      <aside className="surface panel stack"><p className="eyebrow">What leaves your browser</p><h2>Small public footprint.<br />Real verification.</h2><ol className="steps"><li><strong>Private inputs</strong><p>Your invitation secret and issued clearance enter the circuit as private witnesses, not public arguments.</p></li><li><strong>Wallet-assisted proof</strong><p>Your wallet’s proving service may receive witness data. Use a wallet and proving environment you trust; zero-knowledge does not mean the prover cannot see inputs.</p></li><li><strong>Public result</strong><p>The badge, a replay-preventing nullifier, the gate policy, and entry count are public. Wallet transaction metadata may also be visible.</p></li></ol><p className="muted">Each invitation can be redeemed once. An open gate, sufficient clearance, and available capacity are enforced by the contract.</p><Link className="text-link" to="/registry">Inspect the public registry →</Link></aside>
    </div>
    {(status || error || submission) && <section className="surface panel stack" aria-live="polite"><p className="eyebrow">Admission record</p><h2>{receipt ? 'An invitation, verified.' : submission ? 'Submitted. Not yet confirmed.' : 'Proof status'}</h2>{status && <p role="status">{status}</p>}{error && <p className="alert" role="alert">{error}</p>}{submission && <><label className="field">Transaction ID<code className="code-block">{submission.txId}</code></label><label className="field">Badge commitment<code className="code-block">{submission.badge}</code></label><div className="button-row"><a className="button" href={`${EXPLORER_URLS[submission.network]}${submission.address}`} target="_blank" rel="noreferrer">Open contract explorer ↗</a>{!receipt && <button className="button" disabled={busy} onClick={() => void run((signal) => confirm(submission, signal))}>Check confirmation again</button>}{receipt && <button className="button button-primary" onClick={() => downloadJson('cairn-admission-receipt.json', { product: 'Cairn', version: 1, network: submission.network, contractAddress: submission.address, badgeCommitment: submission.badge, ...receipt })}>Download confirmed receipt</button>}</div><p className="muted">A receipt records an indexed transaction and public badge membership. It is not a secret credential or proof of identity.</p><button className="button" disabled={busy} onClick={() => { setSubmission(null); setReceipt(null); setStatus(''); setError(null); setBadge(bytesToHex(randomBytes32())); }}>Start a different invitation</button></>}</section>}
  </div>;
}
