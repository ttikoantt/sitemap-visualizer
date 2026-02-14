import type { ScreenshotConfig, PageSnapshot, PageMetadata, DomStructure } from '../types';
import { fetchRobotsTxt, isPathAllowed } from './robots-parser';

const CORS_PROXY = 'https://corsproxy.io/?url=';

const DEFAULT_CONFIG: ScreenshotConfig = {
  enabled: true,
  rateLimit: 2000,
  respectRobotsTxt: true,
  maxRetries: 2,
  timeout: 30000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Fetch HTML via CORS proxy ---
async function fetchHtmlViaProxy(url: string, timeout: number): Promise<string> {
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.text();
}

// --- DOM Structure Extraction ---
export function extractDomStructure(html: string): DomStructure {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const SEMANTIC_TAGS = new Set([
    'header', 'nav', 'main', 'article', 'section', 'aside',
    'footer', 'form', 'table', 'ul', 'ol', 'dl', 'figure',
    'details', 'dialog', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  ]);

  function walk(element: Element): DomStructure | null {
    const tag = element.tagName.toLowerCase();
    const children: DomStructure[] = [];

    for (const child of element.children) {
      const childResult = walk(child);
      if (childResult) children.push(childResult);
    }

    // Only keep semantic tags, or divs with meaningful children or classes
    const isSemantic = SEMANTIC_TAGS.has(tag);
    const hasSemanticChildren = children.length > 0;
    const hasId = !!element.id;
    const classNames = Array.from(element.classList).filter((c) =>
      !c.match(/^(js-|is-|has-|u-|v-|ng-)/) // filter framework noise
    );

    if (isSemantic || hasSemanticChildren || hasId || tag === 'body') {
      return {
        tag,
        children,
        ...(classNames.length > 0 ? { classNames } : {}),
        ...(hasId ? { id: element.id } : {}),
      };
    }

    // If this div just wraps semantic children, flatten
    if (tag === 'div' && children.length > 0) {
      return { tag, children };
    }

    return children.length === 1 ? children[0] : null;
  }

  const body = doc.body;
  return walk(body) ?? { tag: 'body', children: [] };
}

// --- Page Metadata Extraction ---
export function extractMetadata(html: string): PageMetadata {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getMeta = (name: string): string | undefined => {
    const el = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return el?.getAttribute('content') ?? undefined;
  };

  return {
    title: doc.title || undefined,
    description: getMeta('description'),
    h1: doc.querySelector('h1')?.textContent?.trim() || undefined,
    ogImage: getMeta('og:image'),
    ogTitle: getMeta('og:title'),
    ogDescription: getMeta('og:description'),
  };
}

// --- DOM Fingerprint ---
export function generateDomFingerprint(dom: DomStructure): string {
  function serialize(node: DomStructure): string {
    const childStr = node.children.map(serialize).join(',');
    return `${node.tag}(${childStr})`;
  }
  const serialized = serialize(dom);
  // Simple hash
  let hash = 0;
  for (let i = 0; i < serialized.length; i++) {
    const char = serialized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// --- Main Service ---
export async function fetchPageSnapshot(
  url: string,
  config: ScreenshotConfig = DEFAULT_CONFIG,
): Promise<PageSnapshot> {
  if (!config.enabled) {
    return { url, status: 'pending' };
  }

  // Check robots.txt
  if (config.respectRobotsTxt) {
    try {
      const urlObj = new URL(url);
      const rules = await fetchRobotsTxt(urlObj.hostname);
      if (!isPathAllowed(rules, urlObj.pathname)) {
        return {
          url,
          status: 'blocked',
          error: `robots.txt によりクロールが禁止されています: ${urlObj.pathname}`,
        };
      }
    } catch {
      // robots.txt fetch failed, proceed anyway
    }
  }

  let lastError = '';

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 2s, 4s, 8s...
      await sleep(config.rateLimit * Math.pow(2, attempt - 1));
    }

    try {
      const html = await fetchHtmlViaProxy(url, config.timeout);

      const metadata = extractMetadata(html);
      const domStructure = extractDomStructure(html);
      const domFingerprint = generateDomFingerprint(domStructure);

      const snapshot: PageSnapshot = {
        url,
        metadata,
        domStructure,
        domFingerprint,
        status: 'success',
        fetchedAt: Date.now(),
      };

      // Use og:image as visual representation
      if (metadata.ogImage) {
        // Resolve relative og:image URLs
        try {
          const resolved = new URL(metadata.ogImage, url).href;
          snapshot.screenshotUrl = resolved;
        } catch {
          snapshot.screenshotUrl = metadata.ogImage;
        }
      }

      return snapshot;

    } catch (e) {
      lastError = (e as Error).message;

      // Check if it's a rate limit or server error (retryable)
      if (lastError.includes('403') || lastError.includes('429') || lastError.includes('500')) {
        continue;
      }

      // Non-retryable error
      if (attempt === config.maxRetries) break;
    }
  }

  return {
    url,
    status: 'error',
    error: `取得失敗 (${config.maxRetries + 1}回試行): ${lastError}`,
  };
}

// --- Batch Fetching ---
export async function fetchBatchSnapshots(
  urls: string[],
  config: ScreenshotConfig,
  onProgress?: (completed: number, total: number, snapshot: PageSnapshot) => void,
): Promise<Map<string, PageSnapshot>> {
  const results = new Map<string, PageSnapshot>();
  const rateLimit = Math.max(config.rateLimit, 1000); // minimum 1s between requests

  for (let i = 0; i < urls.length; i++) {
    if (i > 0) await sleep(rateLimit);

    const snapshot = await fetchPageSnapshot(urls[i], config);
    results.set(urls[i], snapshot);

    onProgress?.(i + 1, urls.length, snapshot);
  }

  return results;
}
