import type { DomStructure } from '../types';

// --- Tree Edit Distance (simplified Zhang-Shasha) ---
// Computes similarity between two DOM trees

function getNodeLabel(node: DomStructure): string {
  const parts = [node.tag];
  if (node.id) parts.push(`#${node.id}`);
  if (node.classNames?.length) {
    parts.push(`.${node.classNames.slice(0, 3).join('.')}`);
  }
  return parts.join('');
}

// flattenTree is available for future use in detailed DOM comparison
export function flattenTree(node: DomStructure): string[] {
  const result: string[] = [getNodeLabel(node)];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}

// Structural fingerprint: sequence of tags at each depth
function structuralFingerprint(node: DomStructure, depth: number = 0): string[] {
  const result = [`${depth}:${node.tag}`];
  for (const child of node.children) {
    result.push(...structuralFingerprint(child, depth + 1));
  }
  return result;
}

// --- DOM Similarity ---
export function computeDomSimilarity(dom1: DomStructure, dom2: DomStructure): number {
  const fp1 = structuralFingerprint(dom1);
  const fp2 = structuralFingerprint(dom2);

  // Jaccard similarity of structural fingerprints
  const set1 = new Set(fp1);
  const set2 = new Set(fp2);

  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// --- Structural Signature ---
// Creates a compact signature of the DOM structure for quick comparison
export function computeStructuralSignature(dom: DomStructure): string {
  function sig(node: DomStructure, depth: number): string {
    if (depth > 4) return ''; // Limit depth for performance
    const childSigs = node.children
      .map((c) => sig(c, depth + 1))
      .filter(Boolean)
      .sort()
      .join(',');
    return `${node.tag}(${childSigs})`;
  }
  return sig(dom, 0);
}

// --- CSS Selector Fingerprint ---
// Extracts unique CSS-like selectors from DOM structure
export function extractSelectorFingerprint(dom: DomStructure): string[] {
  const selectors: string[] = [];

  function walk(node: DomStructure, parentPath: string) {
    const label = getNodeLabel(node);
    const path = parentPath ? `${parentPath} > ${label}` : label;
    selectors.push(path);

    for (const child of node.children) {
      walk(child, path);
    }
  }

  walk(dom, '');
  return selectors;
}

// --- Batch DOM Comparison ---
// Groups DOMs by similarity
export function groupByDomSimilarity(
  items: Array<{ url: string; dom: DomStructure }>,
  threshold: number = 0.7,
): Array<{ urls: string[]; similarity: number; representativeUrl: string }> {
  const groups: Array<{ urls: string[]; dom: DomStructure; similarity: number; representativeUrl: string }> = [];

  for (const item of items) {
    let bestGroup: (typeof groups)[number] | null = null;
    let bestSimilarity = 0;

    for (const group of groups) {
      const sim = computeDomSimilarity(item.dom, group.dom);
      if (sim > threshold && sim > bestSimilarity) {
        bestGroup = group;
        bestSimilarity = sim;
      }
    }

    if (bestGroup) {
      bestGroup.urls.push(item.url);
      bestGroup.similarity = Math.min(bestGroup.similarity, bestSimilarity);
    } else {
      groups.push({
        urls: [item.url],
        dom: item.dom,
        similarity: 1,
        representativeUrl: item.url,
      });
    }
  }

  return groups.map(({ urls, similarity, representativeUrl }) => ({
    urls,
    similarity,
    representativeUrl,
  }));
}
