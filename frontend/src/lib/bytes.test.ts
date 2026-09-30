import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, randomBytes32, shorten, textToBytes32 } from './bytes';

describe('Cairn byte utilities', () => {
  it('strictly parses a 32-byte secret and supports an optional hex prefix', () => {
    const value = bytesToHex(randomBytes32());
    expect(bytesToHex(hexToBytes(` 0x${value.toUpperCase()} `))).toBe(value);
    for (const invalid of ['', 'aa', 'gg'.repeat(32), 'a'.repeat(63), 'a'.repeat(65)]) expect(() => hexToBytes(invalid)).toThrow();
  });
  it('measures names in UTF-8 bytes and zero-pads shorter names', () => {
    expect(textToBytes32('Cairn').length).toBe(32);
    expect(textToBytes32('Cairn')[5]).toBe(0);
    expect(() => textToBytes32('é'.repeat(17))).toThrow();
    expect(() => textToBytes32('   ')).toThrow();
    expect(textToBytes32('é'.repeat(16)).length).toBe(32);
  });
  it('uses fresh 32-byte random values', () => {
    const first = randomBytes32();
    expect(first).toHaveLength(32);
    expect(bytesToHex(first)).not.toBe(bytesToHex(randomBytes32()));
  });
  it('keeps short identifiers readable', () => {
    expect(shorten('cairn')).toBe('cairn');
    expect(shorten('0123456789abcdef', 3, 3)).toBe('012…def');
  });
});
