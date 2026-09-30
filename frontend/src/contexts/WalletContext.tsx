import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { ConnectedSession } from '../lib/midnight';
import { getSelectedNetwork, setSelectedNetwork, NETWORK_CHANGED_EVENT, SECRETS_CLEARED_EVENT, type MidnightNetwork } from '../config';
export type { MidnightNetwork } from '../config';
type WalletType = '1am' | 'lace' | 'nightly' | 'midnight wallet' | null;
type WalletStatus = 'checking' | 'detected' | 'not-found';
type InjectedWallet = { api: InitialAPI; type: Exclude<WalletType, null>; name: string };
type WalletContextValue = {
  address: string | null; isConnected: boolean; walletType: WalletType; isConnecting: boolean;
  walletStatus: WalletStatus; session: ConnectedSession | null; error: string | null;
  network: MidnightNetwork; setNetwork: (network: MidnightNetwork) => void;
  connect: (network?: MidnightNetwork) => Promise<ConnectedSession | undefined>;
  disconnect: () => void; clearError: () => void;
};
const WalletContext = createContext<WalletContextValue | null>(null);
export function findWallet(): InjectedWallet | null {
  const entries = Object.entries(window.midnight ?? {});
  // Include the injection key: older mnLace/1am/nightly connectors omit name/rdns.
  const found = entries.find(([, entry]) => typeof entry?.connect === 'function')
    ?? entries.find(([, entry]) => typeof (entry as unknown as { enable?: unknown })?.enable === 'function');
  if (!found) return null;
  const [key, candidate] = found;
  const identity = `${key} ${candidate.name ?? ''} ${candidate.rdns ?? ''}`.toLowerCase();
  const type = identity.includes('lace') ? 'lace' : identity.includes('1am') ? '1am' : identity.includes('nightly') ? 'nightly' : 'midnight wallet';
  return { api: candidate, type, name: candidate.name || key };
}
export function WalletProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [network, updateNetwork] = useState(getSelectedNetwork);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('checking');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<ConnectedSession | null>(null);
  const attempt = useRef(0);
  const connecting = useRef(false);
  const disconnect = useCallback(() => {
    attempt.current += 1;
    connecting.current = false;
    sessionRef.current?.dispose();
    sessionRef.current = null;
    setSession(null); setIsConnecting(false); setError(null);
    window.dispatchEvent(new Event(SECRETS_CLEARED_EVENT));
    // Connector API has no disconnect method; this revokes Cairn's local session.
  }, []);
  const setNetwork = useCallback((next: MidnightNetwork) => { setSelectedNetwork(next); }, []);
  useEffect(() => {
    const sync = () => { disconnect(); updateNetwork(getSelectedNetwork()); };
    window.addEventListener(NETWORK_CHANGED_EVENT, sync);
    return () => { window.removeEventListener(NETWORK_CHANGED_EVENT, sync); sessionRef.current?.dispose(); attempt.current += 1; };
  }, [disconnect]);
  useEffect(() => {
    let elapsed = 0;
    const detect = () => { const wallet = findWallet(); if (wallet) { setWalletType(wallet.type); setWalletStatus('detected'); return true; } return false; };
    if (detect()) return;
    const timer = window.setInterval(() => { elapsed += 250; if (detect() || elapsed >= 7000) { if (elapsed >= 7000 && !findWallet()) setWalletStatus('not-found'); window.clearInterval(timer); } }, 250);
    return () => window.clearInterval(timer);
  }, []);
  const connect = useCallback(async (requested = getSelectedNetwork()) => {
    if (connecting.current) return undefined;
    if (requested !== getSelectedNetwork()) setSelectedNetwork(requested);
    const currentAttempt = ++attempt.current;
    connecting.current = true; setIsConnecting(true); setError(null);
    try {
      const wallet = findWallet();
      if (!wallet) throw new Error('No Midnight wallet detected. Install or unlock Lace, 1AM, or Nightly, then try again.');
      const legacy = wallet.api as InitialAPI & { enable?: InitialAPI['connect'] };
      const method = legacy.connect ?? legacy.enable;
      if (!method) throw new Error('Wallet connector has no connection method.');
      const api = await method.call(wallet.api, requested);
      const { createConnectedSession } = await import('../lib/midnight');
      const connected = await createConnectedSession(api, requested);
      if (currentAttempt !== attempt.current) { connected.dispose(); return undefined; }
      sessionRef.current?.dispose(); sessionRef.current = connected;
      setSession(connected); setWalletType(wallet.type); setWalletStatus('detected');
      return connected;
    } catch (reason) {
      if (currentAttempt === attempt.current) setError(reason instanceof Error ? reason.message : 'Wallet connection failed.');
      return undefined;
    } finally {
      if (currentAttempt === attempt.current) { connecting.current = false; setIsConnecting(false); }
    }
  }, []);
  const clearError = useCallback(() => setError(null), []);
  return <WalletContext.Provider value={{ address: session?.unshieldedAddress ?? null, isConnected: Boolean(session), walletType, isConnecting, walletStatus, session, error, network, setNetwork, connect, disconnect, clearError }}>{children}</WalletContext.Provider>;
}
export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used inside WalletProvider');
  return context;
}
