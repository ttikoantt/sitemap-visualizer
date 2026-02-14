import { describe, it, expect } from 'vitest';
import { hammingDistance, pHashSimilarity } from '../image-comparator';

describe('hammingDistance', () => {
  it('returns 0 for identical hashes', () => {
    expect(hammingDistance('abcdef', 'abcdef')).toBe(0);
  });

  it('counts differing bits correctly', () => {
    // '0' = 0000, '1' = 0001 → 1 bit difference
    expect(hammingDistance('0', '1')).toBe(1);
    // 'f' = 1111, '0' = 0000 → 4 bit differences
    expect(hammingDistance('f', '0')).toBe(4);
  });

  it('returns Infinity for different length hashes', () => {
    expect(hammingDistance('abc', 'abcd')).toBe(Infinity);
  });
});

describe('pHashSimilarity', () => {
  it('returns 1 for identical hashes', () => {
    expect(pHashSimilarity('abcdef1234', 'abcdef1234')).toBe(1);
  });

  it('returns value between 0 and 1', () => {
    const sim = pHashSimilarity('abcdef', '123456');
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('returns 0 for different length hashes', () => {
    expect(pHashSimilarity('abc', 'abcd')).toBe(0);
  });
});
