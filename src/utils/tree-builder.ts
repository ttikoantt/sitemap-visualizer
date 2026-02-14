import type { ParsedURL, URLTreeNode } from '../types';

function createNode(segment: string, fullPath: string, depth: number): URLTreeNode {
  return {
    segment,
    fullPath,
    children: [],
    urls: [],
    depth,
  };
}

function insertURL(root: URLTreeNode, parsed: ParsedURL): void {
  let current = root;

  if (parsed.segments.length === 0) {
    current.urls.push(parsed);
    return;
  }

  for (let i = 0; i < parsed.segments.length; i++) {
    const seg = parsed.segments[i];
    let child = current.children.find((c) => c.segment === seg);
    if (!child) {
      const fullPath = '/' + parsed.segments.slice(0, i + 1).join('/');
      child = createNode(seg, fullPath, current.depth + 1);
      current.children.push(child);
    }
    current = child;
  }

  current.urls.push(parsed);
}

export function buildURLTree(urls: ParsedURL[]): URLTreeNode {
  if (urls.length === 0) {
    return createNode('(root)', '', 0);
  }

  // Group by hostname
  const byHost = new Map<string, ParsedURL[]>();
  for (const url of urls) {
    const list = byHost.get(url.hostname) ?? [];
    list.push(url);
    byHost.set(url.hostname, list);
  }

  if (byHost.size === 1) {
    const [hostname, hostURLs] = [...byHost.entries()][0];
    const root = createNode(hostname, '', 0);
    for (const url of hostURLs) {
      insertURL(root, url);
    }
    return root;
  }

  // Multiple hosts: wrap in virtual root
  const virtualRoot = createNode('(root)', '', 0);
  for (const [hostname, hostURLs] of byHost) {
    const hostNode = createNode(hostname, '', 1);
    for (const url of hostURLs) {
      insertURL(hostNode, url);
    }
    virtualRoot.children.push(hostNode);
  }
  return virtualRoot;
}
