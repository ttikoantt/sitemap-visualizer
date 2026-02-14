import { describe, it, expect } from 'vitest';
import {
  classifySegment,
  detectPatterns,
  classifyPageType,
} from '../pattern-detector';
import { buildURLTree } from '../tree-builder';
import { parseURLList } from '../url-parser';
import type { URLTreeNode } from '../../types';

function patternsFromURLs(urls: string[]) {
  const parsed = parseURLList(urls);
  const tree = buildURLTree(parsed);
  return detectPatterns(tree);
}

describe('classifySegment', () => {
  it('classifies numeric IDs', () => {
    expect(classifySegment(['1', '2', '42', '100'])).toBe('numeric');
  });

  it('classifies UUIDs', () => {
    expect(
      classifySegment([
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ])
    ).toBe('uuid');
  });

  it('classifies date-like 4-digit years', () => {
    expect(classifySegment(['2023', '2024', '2025'])).toBe('date');
  });

  it('classifies slugs', () => {
    expect(classifySegment(['my-first-post', 'hello-world', 'another-post'])).toBe('slug');
  });

  it('classifies mixed values', () => {
    expect(classifySegment(['abc', '123', 'def456'])).toBe('mixed');
  });
});

describe('classifyPageType', () => {
  it('classifies listing page (node with children)', () => {
    const node: URLTreeNode = {
      segment: 'products',
      fullPath: '/products',
      children: [
        { segment: '1', fullPath: '/products/1', children: [], urls: [], depth: 2 },
      ],
      urls: [{ original: 'https://example.com/products', hostname: 'example.com', pathname: '/products', segments: ['products'], query: '', hash: '' }],
      depth: 1,
    };
    const result = classifyPageType(node);
    expect(result.pageType).toBe('listing');
    expect(result.reason).toContain('子ページ');
  });

  it('classifies detail page (leaf with dynamic parent siblings)', () => {
    const node: URLTreeNode = {
      segment: '123',
      fullPath: '/products/123',
      children: [],
      urls: [{ original: 'https://example.com/products/123', hostname: 'example.com', pathname: '/products/123', segments: ['products', '123'], query: '', hash: '' }],
      depth: 2,
    };
    const result = classifyPageType(node, 10);
    expect(result.pageType).toBe('detail');
  });

  it('classifies static page', () => {
    const node: URLTreeNode = {
      segment: 'about',
      fullPath: '/about',
      children: [],
      urls: [{ original: 'https://example.com/about', hostname: 'example.com', pathname: '/about', segments: ['about'], query: '', hash: '' }],
      depth: 1,
    };
    const result = classifyPageType(node, 1);
    expect(result.pageType).toBe('static');
  });

  it('classifies pagination page', () => {
    const node: URLTreeNode = {
      segment: '2',
      fullPath: '/blog/page/2',
      children: [],
      urls: [{ original: 'https://example.com/blog/page/2', hostname: 'example.com', pathname: '/blog/page/2', segments: ['blog', 'page', '2'], query: '', hash: '' }],
      depth: 3,
    };
    // parent segment is "page"
    const result = classifyPageType(node, 5, 'page');
    expect(result.pageType).toBe('pagination');
  });
});

describe('detectPatterns', () => {
  it('detects numeric ID pattern', () => {
    const groups = patternsFromURLs([
      'https://example.com/products/1',
      'https://example.com/products/2',
      'https://example.com/products/3',
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].pattern).toBe('/products/{id}');
    expect(groups[0].urls).toHaveLength(3);
    expect(groups[0].explanation.segments[1].dynamicType).toBe('numeric');
  });

  it('detects slug pattern', () => {
    const groups = patternsFromURLs([
      'https://example.com/blog/my-first-post',
      'https://example.com/blog/hello-world',
      'https://example.com/blog/another-article',
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].pattern).toBe('/blog/{slug}');
  });

  it('detects nested date + slug pattern', () => {
    const groups = patternsFromURLs([
      'https://example.com/blog/2024/01/post-one',
      'https://example.com/blog/2024/02/post-two',
      'https://example.com/blog/2023/12/year-review',
    ]);
    expect(groups.length).toBeGreaterThanOrEqual(1);
    // Should have a group for the full /blog/{year}/{month}/{slug} pattern
    const blogGroup = groups.find((g) => g.pattern.includes('blog'));
    expect(blogGroup).toBeDefined();
    expect(blogGroup!.urls).toHaveLength(3);
  });

  it('does NOT group unrelated paths', () => {
    const groups = patternsFromURLs([
      'https://example.com/about',
      'https://example.com/contact',
    ]);
    // These are static pages, not dynamic patterns
    expect(groups).toHaveLength(0);
  });

  it('respects minimum group size', () => {
    const groups = patternsFromURLs([
      'https://example.com/products/1',
    ]);
    // Only 1 URL, below threshold
    expect(groups).toHaveLength(0);
  });

  it('detects multiple pattern groups', () => {
    const groups = patternsFromURLs([
      'https://example.com/products/1',
      'https://example.com/products/2',
      'https://example.com/products/3',
      'https://example.com/blog/post-one',
      'https://example.com/blog/post-two',
      'https://example.com/about',
    ]);
    expect(groups).toHaveLength(2);
    const productGroup = groups.find((g) => g.pattern.includes('products'));
    const blogGroup = groups.find((g) => g.pattern.includes('blog'));
    expect(productGroup).toBeDefined();
    expect(blogGroup).toBeDefined();
    expect(productGroup!.urls).toHaveLength(3);
    expect(blogGroup!.urls).toHaveLength(2);
  });

  it('generates human-readable explanation', () => {
    const groups = patternsFromURLs([
      'https://example.com/products/1',
      'https://example.com/products/2',
    ]);
    expect(groups[0].explanation.summary).toBeTruthy();
    expect(groups[0].explanation.summary.length).toBeGreaterThan(10);
  });

  it('assigns page type to pattern groups', () => {
    const groups = patternsFromURLs([
      'https://example.com/products/1',
      'https://example.com/products/2',
      'https://example.com/products/3',
    ]);
    expect(groups[0].explanation.pageType).toBe('detail');
  });

  it('detects pagination pattern', () => {
    const groups = patternsFromURLs([
      'https://example.com/blog/page/1',
      'https://example.com/blog/page/2',
      'https://example.com/blog/page/3',
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].explanation.pageType).toBe('pagination');
  });

  it('assigns colors to pattern groups', () => {
    const groups = patternsFromURLs([
      'https://example.com/products/1',
      'https://example.com/products/2',
      'https://example.com/blog/post-a',
      'https://example.com/blog/post-b',
    ]);
    expect(groups[0].color).toBeTruthy();
    expect(groups[1].color).toBeTruthy();
    expect(groups[0].color).not.toBe(groups[1].color);
  });

  it('handles mixed static and dynamic children', () => {
    const groups = patternsFromURLs([
      'https://example.com/products/sale',
      'https://example.com/products/1',
      'https://example.com/products/2',
      'https://example.com/products/3',
    ]);
    // Should group the numeric ones, /products/sale is static
    const numericGroup = groups.find((g) => g.explanation.segments.some((s) => s.dynamicType === 'numeric'));
    expect(numericGroup).toBeDefined();
    expect(numericGroup!.urls).toHaveLength(3);
  });

  it('handles large URL set efficiently', () => {
    const urls: string[] = [];
    for (let i = 0; i < 500; i++) {
      urls.push(`https://example.com/products/${i}`);
    }
    urls.push('https://example.com/about');
    urls.push('https://example.com/contact');

    const start = performance.now();
    const groups = patternsFromURLs(urls);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1000); // Under 1 second
    expect(groups).toHaveLength(1);
    expect(groups[0].urls).toHaveLength(500);
  });
});
