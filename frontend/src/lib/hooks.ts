import { useEffect, useState } from 'react';
import { CONTRACT_CHANGED_EVENT, getStoredContractAddress, SECRETS_CLEARED_EVENT, setStoredContractAddress, type MidnightNetwork } from '../config';
export function useContractAddress(network: MidnightNetwork) {
  const [address, setAddress] = useState(() => getStoredContractAddress(network));
  useEffect(() => {
    const sync = () => setAddress(getStoredContractAddress(network));
    sync();
    window.addEventListener(CONTRACT_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(CONTRACT_CHANGED_EVENT, sync); window.removeEventListener('storage', sync); };
  }, [network]);
  return { address, setAddress, saveAddress: (value: string) => setStoredContractAddress(value, network) };
}
export function useClearSecrets(clear: () => void) {
  useEffect(() => {
    window.addEventListener(SECRETS_CLEARED_EVENT, clear);
    return () => window.removeEventListener(SECRETS_CLEARED_EVENT, clear);
  }, [clear]);
}
