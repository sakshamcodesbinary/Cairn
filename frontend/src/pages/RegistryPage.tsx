import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EXPLORER_URLS, NETWORKS } from '../config';
import { useWallet } from '../contexts/WalletContext';
import { bytesToHex, hexToBytes } from '../lib/bytes';
import { readGate, validateAddress, type Ledger } from '../lib/contract';
import { useContractAddress } from '../lib/hooks';

type Snapshot = { address: string; ledger: Ledger; readAt: string };
export default function RegistryPage() {
  const { network } = useWallet();
  const { address, setAddress } = useContractAddress(network);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [badge, setBadge] = useState('');
  const [membership, setMembership] = useState<{ badge: string; found: boolean; readAt: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    request.current?.abort(); setSnapshot(null); setMembership(null); setError(null); setLoading(false);
    return () => request.current?.abort();
  }, [network, address]);
  const load = async (lookup: boolean) => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(null); setMembership(null);
    try {
      const target = validateAddress(address);
      const commitment = lookup ? hexToBytes(badge) : null;
      const ledger = await readGate(target, network, controller.signal);
      if (controller.signal.aborted) return;
      const readAt = new Date().toLocaleTimeString();
      setSnapshot({ address: target, ledger, readAt });
      if (commitment) setMembership({ badge: bytesToHex(commitment), found: ledger.badge_registry.member(commitment), readAt });
    } catch (reason) {
      if (!controller.signal.aborted) { setSnapshot(null); setError(reason instanceof Error ? reason.message : 'Unable to read the public registry.'); }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void load(false); };
  const gate = snapshot?.ledger;
  const name = gate ? new TextDecoder().decode(gate.gate_name).replace(/\0+$/, '') : '';
  return <div className="page-shell working-page">
    <header className="page-heading"><p className="eyebrow">The public record</p><h1>Trust, without a guest list.</h1><p>Read a gate’s on-chain policy and check a badge commitment. No wallet connection is required.</p></header>
    <form className="surface panel stack" onSubmit={submit}><div className="section-title"><h2>Find a gate</h2><span className="network-pill">{NETWORKS[network].label}</span></div><label className="field">Contract address<input className="input mono" value={address} spellCheck={false} autoComplete="off" required placeholder="Paste a deployed Cairn contract address" onChange={(event) => setAddress(event.target.value)} /></label><div className="button-row"><button className="button button-primary" disabled={loading} type="submit">{loading ? 'Reading indexer…' : 'Read public registry'}</button>{snapshot && <a className="button" href={`${EXPLORER_URLS[network]}${snapshot.address}`} target="_blank" rel="noreferrer">View on explorer ↗</a>}</div><p className="muted">Source: {NETWORKS[network].indexerUrl}. A read is a point-in-time indexed snapshot, not a live subscription.</p></form>
    {error && <p className="alert" role="alert">{error}</p>}
    {!snapshot && !loading && !error && <section className="surface panel empty-state"><h2>No gate loaded</h2><p>Paste an address to see real ledger data. Counts and membership are never estimated.</p><Link className="text-link" to="/admin">Create your first gate →</Link></section>}
    {snapshot && gate && <>
      <section className="surface panel stack" aria-live="polite"><div className="section-title"><div><p className="eyebrow">Indexed gate</p><h2>{name || 'Unnamed gate'}</h2></div><span className="status-pill">{gate.is_open ? 'Open' : 'Paused'}</span></div><p className="muted">Read at {snapshot.readAt} · {NETWORKS[network].label}</p><div className="stat-grid"><div className="stat"><span>Verified entries</span><strong>{gate.verified_entries.toString()}</strong></div><div className="stat"><span>Gate capacity</span><strong>{gate.max_entries.toString()}</strong></div><div className="stat"><span>Minimum clearance</span><strong>{gate.minimum_clearance.toString()}</strong></div><div className="stat"><span>Registered badges</span><strong>{gate.badge_registry.size().toString()}</strong></div></div><dl className="ledger-details"><div><dt>Invitation commitment</dt><dd><code>{bytesToHex(gate.allowlist_root)}</code></dd></div><div><dt>Admin public key</dt><dd><code>{bytesToHex(gate.admin_public_key)}</code></dd></div><div><dt>Recorded nullifiers</dt><dd>{gate.nullifiers.size().toString()}</dd></div></dl><p className="muted">These are public contract values, not personal identities. A recorded nullifier prevents the same invitation from being used twice.</p></section>
      <section className="surface panel stack"><p className="eyebrow">Badge lookup</p><h2>Check an admission commitment</h2><form className="stack" onSubmit={(event) => { event.preventDefault(); void load(true); }}><label className="field">Public badge commitment<input className="input mono" required spellCheck={false} autoComplete="off" value={badge} onChange={(event) => { setBadge(event.target.value); setMembership(null); }} placeholder="64 hexadecimal characters from a receipt" /><small>Use the public badge, never an invitation or admin secret.</small></label><button className="button button-primary" disabled={loading} type="submit">{loading ? 'Checking ledger…' : 'Look up badge'}</button></form>{membership && <div className="alert" role="status"><strong>{membership.found ? 'Badge is registered.' : 'Badge was not found.'}</strong><p>{membership.found ? 'This commitment is a member of the gate’s indexed badge registry.' : 'This commitment is absent from this snapshot. Check the gate, network, and transaction confirmation.'}</p><code className="code-block">{membership.badge}</code><small>Checked at {membership.readAt}. Membership does not establish the presenter’s identity or ownership.</small></div>}</section>
    </>}
  </div>;
}
