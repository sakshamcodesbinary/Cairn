import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanContractAddress, getStoredContractAddress, isValidContractAddress, resetContractAddress, setStoredContractAddress } from '../config';

describe('network-scoped Cairn addresses', () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) }, dispatchEvent: vi.fn() });
    resetContractAddress('preview'); resetContractAddress('preprod');
  });
  afterEach(() => vi.unstubAllGlobals());
  it('has no old deployment fallback and never reads the legacy storage key', () => {
    storage.set('DEPLOYED_CONTRACT_ADDRESS', 'a'.repeat(64));
    expect(getStoredContractAddress('preview')).toBe('');
    expect(getStoredContractAddress('preprod')).toBe('');
  });
  it('isolates addresses across networks', () => {
    expect(setStoredContractAddress('a'.repeat(64), 'preview')).toBe(true);
    expect(setStoredContractAddress('b'.repeat(64), 'preprod')).toBe(true);
    expect(getStoredContractAddress('preview')).toBe('a'.repeat(64));
    expect(getStoredContractAddress('preprod')).toBe('b'.repeat(64));
  });
  it('updates session memory even when persistence fails', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    expect(setStoredContractAddress('c'.repeat(64), 'preview')).toBe(false);
    expect(getStoredContractAddress('preview')).toBe('c'.repeat(64));
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
  it('normalizes and rejects malformed contract addresses', () => {
    expect(cleanContractAddress(` 0x${'AB'.repeat(32)} `)).toBe('ab'.repeat(32));
    expect(isValidContractAddress('0x' + 'ab'.repeat(32))).toBe(true);
    expect(isValidContractAddress('gg'.repeat(32))).toBe(false);
    expect(setStoredContractAddress('short', 'preview')).toBe(false);
  });
});
