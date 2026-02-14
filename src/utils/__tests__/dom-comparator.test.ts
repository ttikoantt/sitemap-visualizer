import { describe, it, expect } from 'vitest';
import { computeDomSimilarity, computeStructuralSignature, groupByDomSimilarity } from '../dom-comparator';
import type { DomStructure } from '../../types';

describe('computeDomSimilarity', () => {
  it('returns 1 for identical DOMs', () => {
    const dom: DomStructure = {
      tag: 'body',
      children: [
        { tag: 'header', children: [{ tag: 'nav', children: [] }] },
        { tag: 'main', children: [{ tag: 'article', children: [] }] },
        { tag: 'footer', children: [] },
      ],
    };
    expect(computeDomSimilarity(dom, dom)).toBe(1);
  });

  it('returns high similarity for similar DOMs', () => {
    const dom1: DomStructure = {
      tag: 'body',
      children: [
        { tag: 'header', children: [{ tag: 'nav', children: [] }] },
        { tag: 'main', children: [{ tag: 'article', children: [] }] },
        { tag: 'footer', children: [] },
      ],
    };
    const dom2: DomStructure = {
      tag: 'body',
      children: [
        { tag: 'header', children: [{ tag: 'nav', children: [] }] },
        { tag: 'main', children: [{ tag: 'section', children: [] }] },
        { tag: 'footer', children: [] },
      ],
    };
    const sim = computeDomSimilarity(dom1, dom2);
    expect(sim).toBeGreaterThan(0.7);
  });

  it('returns low similarity for different DOMs', () => {
    const dom1: DomStructure = {
      tag: 'body',
      children: [
        { tag: 'header', children: [] },
        { tag: 'main', children: [] },
      ],
    };
    const dom2: DomStructure = {
      tag: 'body',
      children: [
        { tag: 'form', children: [
          { tag: 'table', children: [] },
          { tag: 'ul', children: [] },
        ] },
      ],
    };
    const sim = computeDomSimilarity(dom1, dom2);
    expect(sim).toBeLessThan(0.5);
  });
});

describe('computeStructuralSignature', () => {
  it('produces same signature for identical DOMs', () => {
    const dom: DomStructure = {
      tag: 'body',
      children: [{ tag: 'main', children: [] }],
    };
    expect(computeStructuralSignature(dom)).toBe(computeStructuralSignature(dom));
  });

  it('produces different signatures for different DOMs', () => {
    const dom1: DomStructure = { tag: 'body', children: [{ tag: 'main', children: [] }] };
    const dom2: DomStructure = { tag: 'body', children: [{ tag: 'form', children: [] }] };
    expect(computeStructuralSignature(dom1)).not.toBe(computeStructuralSignature(dom2));
  });
});

describe('groupByDomSimilarity', () => {
  it('groups similar DOMs together', () => {
    const templateA: DomStructure = {
      tag: 'body',
      children: [
        { tag: 'header', children: [{ tag: 'nav', children: [] }] },
        { tag: 'main', children: [{ tag: 'article', children: [] }] },
      ],
    };

    const items = [
      { url: 'https://a.com/1', dom: templateA },
      { url: 'https://a.com/2', dom: templateA },
      { url: 'https://a.com/3', dom: { tag: 'body', children: [{ tag: 'form', children: [{ tag: 'table', children: [] }] }] } },
    ];

    const groups = groupByDomSimilarity(items, 0.7);
    // First two should be grouped, third is separate
    const bigGroup = groups.find((g) => g.urls.length === 2);
    expect(bigGroup).toBeDefined();
    expect(bigGroup!.urls).toContain('https://a.com/1');
    expect(bigGroup!.urls).toContain('https://a.com/2');
  });
});
