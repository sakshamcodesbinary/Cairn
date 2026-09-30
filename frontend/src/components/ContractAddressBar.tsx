import { useState, type FormEvent } from 'react';
import { Check, Copy, ExternalLink, Pencil, X } from 'lucide-react';
import { EXPLORER_URLS, isValidContractAddress, resetContractAddress, type MidnightNetwork } from '../config';
import { useWallet } from '../contexts/WalletContext';
import { useContractAddress } from '../lib/hooks';
import { shorten } from '../lib/bytes';

export default function ContractAddressBar() {
  const { network, setNetwork, isConnected, isConnecting } = useWallet();
  const { address, saveAddress } = useContractAddress(network);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidContractAddress(draft)) { setNotice('Enter a 64-character hexadecimal contract address.'); return; }
    const persisted = saveAddress(draft);
    setNotice(persisted ? 'Gate address saved. Its on-chain state has not been verified yet.' : 'Address active for this session. Browser storage is unavailable.');
    setEditing(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setNotice('Clipboard unavailable. Select and copy the address manually.'); }
  };
  return <div className="contract-bar"><div className="contract-bar-inner">
    <label className="network-selector">Network<select aria-label="Active network" value={network} disabled={isConnecting} onChange={event => { setNetwork(event.target.value as MidnightNetwork); setEditing(false); setNotice(isConnected ? 'Network changed. Reconnect your wallet before transacting.' : ''); }}><option value="preview">Preview</option><option value="preprod">Preprod</option></select></label>
    <span className="contract-label">Active gate</span>
    {editing ? <form className="contract-edit" onSubmit={apply}><label className="sr-only" htmlFor="active-gate">Contract address</label><input id="active-gate" className="input mono" value={draft} onChange={event => setDraft(event.target.value)} placeholder="64-character contract address" spellCheck={false} autoFocus /><button className="button button-primary button-tiny" type="submit">Save</button><button type="button" className="icon-button" aria-label="Cancel address editing" onClick={() => setEditing(false)}><X size={17} /></button></form> : <>
      {address ? <><code className="contract-value" title={address}>{shorten(address, 10, 8)}</code><button className="icon-button" aria-label="Copy active gate address" onClick={() => void copy()}>{copied ? <Check size={15} /> : <Copy size={15} />}</button><a className="icon-button" aria-label="Open active gate in explorer" href={`${EXPLORER_URLS[network]}${address}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a></> : <span className="contract-empty">No deployment selected</span>}
      <div className="contract-actions"><button className="text-button" onClick={() => { setDraft(address); setEditing(true); setNotice(''); }}><Pencil size={13} aria-hidden="true" />{address ? 'Change gate' : 'Set address'}</button>{address && <button className="text-button" onClick={() => { resetContractAddress(network); setNotice('Local address cleared. The on-chain contract is unchanged.'); }}>Clear</button>}</div>
    </>}
  </div>{notice && <p className="contract-notice" role="status">{notice}</p>}</div>;
}
