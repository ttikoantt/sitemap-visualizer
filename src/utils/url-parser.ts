import type { ParsedURL } from '../types';

export function parseURL(raw: string): ParsedURL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = 'https://' + urlString;
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }

  if (!url.hostname || !url.hostname.includes('.')) {
    return null;
  }

  const hostname = url.host.toLowerCase(); // includes port if present
  let pathname = decodeURIComponent(url.pathname);

  // Normalize trailing slash (keep root as '/')
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const segments = pathname
    .split('/')
    .filter((s) => s.length > 0);

  return {
    original: trimmed,
    hostname,
    pathname,
    segments,
    query: url.search,
    hash: url.hash,
  };
}

export function parseURLList(rawList: string[]): ParsedURL[] {
  const seen = new Set<string>();
  const results: ParsedURL[] = [];

  for (const raw of rawList) {
    const parsed = parseURL(raw);
    if (!parsed) continue;

    const key = `${parsed.hostname}${parsed.pathname}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push(parsed);
  }

  return results;
}
