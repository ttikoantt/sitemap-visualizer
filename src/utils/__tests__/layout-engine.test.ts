import { describe, it, expect } from 'vitest';
import { computeLayout } from '../layout-engine';
import { buildURLTree } from '../tree-builder';
import { parseURLList } from '../url-parser';
import { detectPatterns } from '../pattern-detector';

async function layoutFromURLs(urls: string[]) {
  const parsed = parseURLList(urls);
  const tree = buildURLTree(parsed);
  const patterns = detectPatterns(tree);
  return computeLayout(tree, patterns);
}

describe('computeLayout', () => {
  it('produces valid React Flow nodes with positions', async () => {
    const { nodes, edges } = await layoutFromURLs([
      'https://example.com/about',
      'https://example.com/contact',
    ]);
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(node.position).toBeDefined();
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(node.id).toBeTruthy();
    }
  });

  it('produces edges connecting parent to children', async () => {
    const { nodes, edges } = await layoutFromURLs([
      'https://example.com/products/shoes',
      'https://example.com/products/hats',
    ]);
    expect(edges.length).toBeGreaterThan(0);
    for (const edge of edges) {
      expect(edge.source).toBeTruthy();
      expect(edge.target).toBeTruthy();
      // Source and target should reference existing nodes
      expect(nodes.some((n) => n.id === edge.source)).toBe(true);
      expect(nodes.some((n) => n.id === edge.target)).toBe(true);
    }
  });

  it('includes root node', async () => {
    const { nodes } = await layoutFromURLs([
      'https://example.com/about',
    ]);
    const root = nodes.find((n) => n.data.label === 'example.com');
    expect(root).toBeDefined();
  });

  it('assigns pattern group data to nodes', async () => {
    const { nodes } = await layoutFromURLs([
      'https://example.com/products/1',
      'https://example.com/products/2',
      'https://example.com/products/3',
    ]);
    // The grouped nodes should have patternGroup data
    const groupedNodes = nodes.filter((n) => n.data.patternGroup);
    expect(groupedNodes.length).toBeGreaterThan(0);
  });

  it('sets correct depth on node data', async () => {
    const { nodes } = await layoutFromURLs([
      'https://example.com/a/b/c',
    ]);
    const nodeC = nodes.find((n) => n.data.label === 'c');
    expect(nodeC).toBeDefined();
    expect(nodeC!.data.depth).toBe(3);
  });

  it('handles empty tree', async () => {
    const parsed = parseURLList([]);
    const tree = buildURLTree(parsed);
    const patterns = detectPatterns(tree);
    const { nodes, edges } = await computeLayout(tree, patterns);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it('handles large tree efficiently', async () => {
    const urls: string[] = [];
    for (let i = 0; i < 200; i++) {
      urls.push(`https://example.com/products/${i}`);
    }

    const start = performance.now();
    const { nodes } = await layoutFromURLs(urls);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(3000);
    expect(nodes.length).toBeGreaterThan(0);
  });
});
