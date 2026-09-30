export type MidnightNetwork = 'preview' | 'preprod';
export const DEFAULT_NETWORK: MidnightNetwork = import.meta.env.VITE_NETWORK === 'preprod' ? 'preprod' : 'preview';
export const NETWORK_CHANGED_EVENT = 'cairn-network-changed';
export const CONTRACT_CHANGED_EVENT = 'cairn-contract-changed';
export const SECRETS_CLEARED_EVENT = 'cairn-secrets-cleared';
export const DEFAULT_CONTRACT_ADDRESS = '';
export const MINIMUM_CLEARANCE = 2;
export const MAX_GATE_ENTRIES = 250;
export const NETWORKS = {
  preview: {
    label: 'Preview',
    indexerUrl: import.meta.env.VITE_PREVIEW_INDEXER_URL || 'https://indexer.preview.midnight.network/api/v3/graphql',
    indexerWsUrl: import.meta.env.VITE_PREVIEW_INDEXER_WS_URL || 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
  },
  preprod: {
    label: 'Preprod',
    indexerUrl: import.meta.env.VITE_PREPROD_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v3/graphql',
    indexerWsUrl: import.meta.env.VITE_PREPROD_INDEXER_WS_URL || 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
  },
} as const;
export const EXPLORER_URLS = {
  preview: 'https://preview.midnightexplorer.com/contracts/',
  preprod: 'https://preprod.midnightexplorer.com/contracts/',
} as const;
let selectedNetwork: MidnightNetwork = DEFAULT_NETWORK;
const addresses = new Map<MidnightNetwork, string>();

export function getSelectedNetwork(): MidnightNetwork { return selectedNetwork; }
export function setSelectedNetwork(network: MidnightNetwork): void {
  if (network !== 'preview' && network !== 'preprod') throw new Error('Unsupported Midnight network.');
  if (network === selectedNetwork) return;
  selectedNetwork = network;
  window.dispatchEvent(new CustomEvent(NETWORK_CHANGED_EVENT, { detail: network }));
  window.dispatchEvent(new CustomEvent(CONTRACT_CHANGED_EVENT));
}
export function cleanContractAddress(value: string): string { return value.trim().replace(/^0x/i, '').toLowerCase(); }
export function isValidContractAddress(value: string): boolean { return /^[0-9a-f]{64}$/.test(cleanContractAddress(value)); }
export function getContractAddressStatus(value: string): { isValid: boolean; message: string } {
  const isValid = isValidContractAddress(value);
  return { isValid, message: isValid ? 'Contract address looks valid.' : value.trim() ? 'Enter a 64-character hexadecimal contract address.' : 'Deploy a gate or paste a contract address.' };
}
export function getStoredContractAddress(network = getSelectedNetwork()): string {
  if (addresses.has(network)) return addresses.get(network)!;
  try {
    const stored = window.localStorage.getItem(`cairn:v1:${network}:contract`);
    if (stored && isValidContractAddress(stored)) return cleanContractAddress(stored);
  } catch { /* Storage may be unavailable; session memory remains usable. */ }
  const configured = network === 'preview'
    ? import.meta.env.VITE_PREVIEW_CONTRACT_ADDRESS
    : import.meta.env.VITE_PREPROD_CONTRACT_ADDRESS;
  const fallback = configured || (network === DEFAULT_NETWORK ? import.meta.env.VITE_CONTRACT_ADDRESS : '');
  return typeof fallback === 'string' && isValidContractAddress(fallback) ? cleanContractAddress(fallback) : '';
}
export function setStoredContractAddress(value: string, network = getSelectedNetwork()): boolean {
  if (!isValidContractAddress(value)) return false;
  const address = cleanContractAddress(value);
  addresses.set(network, address);
  let persisted = true;
  try { window.localStorage.setItem(`cairn:v1:${network}:contract`, address); } catch { persisted = false; }
  window.dispatchEvent(new CustomEvent(CONTRACT_CHANGED_EVENT, { detail: address }));
  return persisted;
}
export function resetContractAddress(network = getSelectedNetwork()): void {
  addresses.set(network, '');
  try { window.localStorage.removeItem(`cairn:v1:${network}:contract`); } catch { /* Optional persistence. */ }
  window.dispatchEvent(new CustomEvent(CONTRACT_CHANGED_EVENT));
}
// Initial snapshot only. Interactive views subscribe through useContractAddress().
export const CONTRACT_ADDRESS = getStoredContractAddress();
