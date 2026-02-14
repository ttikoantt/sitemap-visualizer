import { describe, it, expect } from 'vitest';
import { buildURLTree } from '../tree-builder';
import { parseURLList } from '../url-parser';

function buildFromURLs(urls: string[]) {
  return buildURLTree(parseURLList(urls));
}

describe('buildURLTree', () => {
  it('builds a single-level tree', () => {
    const tree = buildFromURLs([
      'https://example.com/about',
      'https://example.com/contact',
    ]);
    expect(tree.segment).toBe('example.com');
    expect(tree.children).toHaveLength(2);
    expect(tree.children.map((c) => c.segment).sort()).toEqual(['about', 'contact']);
  });

  it('builds a multi-level tree', () => {
    const tree = buildFromURLs([
      'https://example.com/products/shoes/nike',
      'https://example.com/products/shoes/adidas',
      'https://example.com/products/hats',
    ]);
    expect(tree.segment).toBe('example.com');
    const products = tree.children.find((c) => c.segment === 'products');
    expect(products).toBeDefined();
    expect(products!.children).toHaveLength(2); // shoes, hats

    const shoes = products!.children.find((c) => c.segment === 'shoes');
    expect(shoes).toBeDefined();
    expect(shoes!.children).toHaveLength(2); // nike, adidas
  });

  it('handles root URL (no segments)', () => {
    const tree = buildFromURLs(['https://example.com/']);
    expect(tree.segment).toBe('example.com');
    expect(tree.urls).toHaveLength(1);
    expect(tree.children).toHaveLength(0);
  });

  it('handles multiple hostnames with virtual root', () => {
    const tree = buildFromURLs([
      'https://example.com/page1',
      'https://other.com/page2',
    ]);
    // Virtual root wrapping multiple hosts
    expect(tree.segment).toBe('(root)');
    expect(tree.children).toHaveLength(2);
    expect(tree.children.map((c) => c.segment).sort()).toEqual(['example.com', 'other.com']);
  });

  it('handles single hostname without virtual root', () => {
    const tree = buildFromURLs([
      'https://example.com/a',
      'https://example.com/b',
    ]);
    // Single host: root IS the hostname
    expect(tree.segment).toBe('example.com');
  });

  it('sets correct fullPath for each node', () => {
    const tree = buildFromURLs([
      'https://example.com/blog/2024/post',
    ]);
    const blog = tree.children[0];
    expect(blog.fullPath).toBe('/blog');

    const year = blog.children[0];
    expect(year.fullPath).toBe('/blog/2024');

    const post = year.children[0];
    expect(post.fullPath).toBe('/blog/2024/post');
  });

  it('sets correct depth for each node', () => {
    const tree = buildFromURLs([
      'https://example.com/a/b/c',
    ]);
    expect(tree.depth).toBe(0);
    expect(tree.children[0].depth).toBe(1); // a
    expect(tree.children[0].children[0].depth).toBe(2); // b
    expect(tree.children[0].children[0].children[0].depth).toBe(3); // c
  });

  it('attaches URLs to leaf nodes', () => {
    const tree = buildFromURLs([
      'https://example.com/products/123',
      'https://example.com/products/456',
    ]);
    const products = tree.children[0];
    expect(products.urls).toHaveLength(0); // not a leaf itself

    const n123 = products.children.find((c) => c.segment === '123');
    expect(n123!.urls).toHaveLength(1);
    expect(n123!.urls[0].original).toBe('https://example.com/products/123');
  });

  it('attaches URL to intermediate node if it is also a valid endpoint', () => {
    const tree = buildFromURLs([
      'https://example.com/products',
      'https://example.com/products/123',
    ]);
    const products = tree.children[0];
    expect(products.urls).toHaveLength(1); // /products itself
    expect(products.children).toHaveLength(1); // /products/123
  });

  it('handles deep nesting (10+ levels)', () => {
    const tree = buildFromURLs([
      'https://example.com/a/b/c/d/e/f/g/h/i/j',
    ]);
    let node = tree;
    const segments = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    for (const seg of segments) {
      expect(node.children).toHaveLength(1);
      node = node.children[0];
      expect(node.segment).toBe(seg);
    }
  });

  it('returns empty tree for empty input', () => {
    const tree = buildURLTree([]);
    expect(tree.segment).toBe('(root)');
    expect(tree.children).toHaveLength(0);
  });
});
