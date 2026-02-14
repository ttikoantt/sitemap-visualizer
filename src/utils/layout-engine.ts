import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';
import type { URLTreeNode, PatternGroup, SitemapNodeData } from '../types';
import { classifyPageType } from './pattern-detector';

const elk = new ELK();

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

interface FlatNode {
  id: string;
  treeNode: URLTreeNode;
  parentId: string | null;
  patternGroup?: PatternGroup;
}

function flattenTree(
  node: URLTreeNode,
  parentId: string | null,
  patterns: PatternGroup[],
  result: FlatNode[],
  idPrefix: string = '',
): void {
  // Skip virtual root with no segment
  if (node.segment === '(root)' && node.children.length === 0) return;

  const id = idPrefix ? `${idPrefix}/${node.segment}` : node.segment;

  // Find matching pattern for this node
  const patternGroup = patterns.find((p) =>
    p.urls.some((u) => {
      const urlPath = u.pathname;
      return urlPath === node.fullPath;
    })
  );

  result.push({ id, treeNode: node, parentId, patternGroup });

  for (const child of node.children) {
    flattenTree(child, id, patterns, result, id);
  }
}

function buildPatternMap(patterns: PatternGroup[]): Map<string, PatternGroup> {
  const map = new Map<string, PatternGroup>();
  for (const p of patterns) {
    for (const url of p.urls) {
      map.set(url.pathname, p);
    }
  }
  return map;
}

export async function computeLayout(
  root: URLTreeNode,
  patterns: PatternGroup[],
  direction: 'DOWN' | 'RIGHT' = 'DOWN',
): Promise<{ nodes: Node<SitemapNodeData>[]; edges: Edge[] }> {
  if (root.segment === '(root)' && root.children.length === 0) {
    return { nodes: [], edges: [] };
  }

  const flatNodes: FlatNode[] = [];
  const patternMap = buildPatternMap(patterns);

  if (root.segment === '(root)') {
    // Multi-host: flatten each host child
    for (const hostChild of root.children) {
      flattenTree(hostChild, null, patterns, flatNodes);
    }
  } else {
    flattenTree(root, null, patterns, flatNodes);
  }

  // Build ELK graph
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'mrtree',
      'elk.direction': direction,
      'elk.spacing.nodeNode': '30',
      'elk.mrtree.spacing.nodeNode': '30',
    },
    children: flatNodes.map((fn) => ({
      id: fn.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: flatNodes
      .filter((fn) => fn.parentId !== null)
      .map((fn, i) => ({
        id: `e${i}`,
        sources: [fn.parentId!],
        targets: [fn.id],
      })),
  };

  const layoutResult = await elk.layout(elkGraph);

  const positionMap = new Map<string, { x: number; y: number }>();
  for (const child of layoutResult.children ?? []) {
    positionMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }

  const nodes: Node<SitemapNodeData>[] = flatNodes.map((fn) => {
    const pos = positionMap.get(fn.id) ?? { x: 0, y: 0 };
    const matchedPattern = patternMap.get(fn.treeNode.fullPath) ?? fn.patternGroup;
    const siblingCount = flatNodes.filter((f) => f.parentId === fn.parentId).length;

    const parentNode = flatNodes.find((f) => f.id === fn.parentId);
    const parentSegment = parentNode?.treeNode.segment ?? '';
    const { pageType } = classifyPageType(fn.treeNode, siblingCount, parentSegment);

    const urlCount = countURLs(fn.treeNode);

    return {
      id: fn.id,
      type: 'urlNode',
      position: pos,
      data: {
        label: fn.treeNode.segment,
        fullPath: fn.treeNode.fullPath || '/',
        urlCount,
        patternGroup: matchedPattern,
        pageType,
        depth: fn.treeNode.depth,
        isLeaf: fn.treeNode.children.length === 0,
        isGrouped: !!matchedPattern,
      },
    };
  });

  const edges: Edge[] = flatNodes
    .filter((fn) => fn.parentId !== null)
    .map((fn, i) => ({
      id: `e${i}`,
      source: fn.parentId!,
      target: fn.id,
      type: 'smoothstep',
    }));

  return { nodes, edges };
}

function countURLs(node: URLTreeNode): number {
  let count = node.urls.length;
  for (const child of node.children) {
    count += countURLs(child);
  }
  return count;
}
