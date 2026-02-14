import type { ScreenshotConfig, PageSnapshot, PageMetadata, DomStructure } from '../types';
import { fetchRobotsTxt, isPathAllowed } from './robots-parser';

const DEFAULT_CONFIG: ScreenshotConfig = {
  method: 'none',
  apiKey: '',
  rateLimit: 2000,
  respectRobotsTxt: true,
  maxRetries: 2,
  timeout: 30000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- ScreenshotOne API ---
async function fetchViaScreenshotOne(
  url: string,
  apiKey: string,
  timeout: number,
): Promise<{ screenshotBase64: string }> {
  const params = new URLSearchParams({
    access_key: apiKey,
    url,
    format: 'png',
    viewport_width: '1280',
    viewport_height: '900',
    full_page: 'false',
    delay: '2', // wait 2s for JS to render
    block_ads: 'true',
    block_trackers: 'true',
  });

  const res = await fetch(`https://api.screenshotone.com/take?${params}`, {
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ScreenshotOne error ${res.status}: ${text}`);
  }

  const blob = await res.blob();
  const base64 = await blobToBase64(blob);
  return { screenshotBase64: base64 };
}

// --- ScrapingBee API ---
async function fetchViaScrapingBee(
  url: string,
  apiKey: string,
  timeout: number,
): Promise<{ screenshotBase64: string; html: string }> {
  // Screenshot
  const screenshotParams = new URLSearchParams({
    api_key: apiKey,
    url,
    screenshot: 'true',
    screenshot_full_page: 'false',
    render_js: 'true',
    wait: '2000',
    block_ads: 'true',
    premium_proxy: 'true', // residential proxy for anti-bot bypass
  });

  const screenshotRes = await fetch(`https://app.scrapingbee.com/api/v1?${screenshotParams}`, {
    signal: AbortSignal.timeout(timeout),
  });

  if (!screenshotRes.ok) {
    const text = await screenshotRes.text();
    throw new Error(`ScrapingBee error ${screenshotRes.status}: ${text}`);
  }

  const screenshotBlob = await screenshotRes.blob();
  const screenshotBase64 = await blobToBase64(screenshotBlob);

  // HTML content (separate request for DOM)
  const htmlParams = new URLSearchParams({
    api_key: apiKey,
    url,
    render_js: 'true',
    wait: '2000',
    premium_proxy: 'true',
  });

  let html = '';
  try {
    const htmlRes = await fetch(`https://app.scrapingbee.com/api/v1?${htmlParams}`, {
      signal: AbortSignal.timeout(timeout),
    });
    if (htmlRes.ok) {
      html = await htmlRes.text();
    }
  } catch {
    // HTML fetch failed, continue with screenshot only
  }

  return { screenshotBase64, html };
}

// --- Custom proxy ---
async function fetchViaProxy(
  url: string,
  proxyUrl: string,
  timeout: number,
): Promise<{ screenshotBase64?: string; html: string }> {
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      screenshot: true,
      waitFor: 2000,
    }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    throw new Error(`Proxy error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    screenshotBase64: data.screenshot,
    html: data.html || '',
  };
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
  if (config.method === 'none') {
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
      let screenshotBase64: string | undefined;
      let html = '';

      switch (config.method) {
        case 'screenshotone': {
          const result = await fetchViaScreenshotOne(url, config.apiKey, config.timeout);
          screenshotBase64 = result.screenshotBase64;
          break;
        }
        case 'scrapingbee': {
          const result = await fetchViaScrapingBee(url, config.apiKey, config.timeout);
          screenshotBase64 = result.screenshotBase64;
          html = result.html;
          break;
        }
        case 'proxy': {
          const result = await fetchViaProxy(url, config.proxyUrl || '', config.timeout);
          screenshotBase64 = result.screenshotBase64;
          html = result.html;
          break;
        }
      }

      const snapshot: PageSnapshot = {
        url,
        screenshotBase64,
        status: 'success',
        fetchedAt: Date.now(),
      };

      // Extract metadata and DOM from HTML if available
      if (html) {
        snapshot.metadata = extractMetadata(html);
        snapshot.domStructure = extractDomStructure(html);
        snapshot.domFingerprint = generateDomFingerprint(snapshot.domStructure);
      }

      // Create blob URL for display
      if (screenshotBase64) {
        snapshot.screenshotUrl = screenshotBase64;
      }

      return snapshot;

    } catch (e) {
      lastError = (e as Error).message;

      // Check if it's a bot detection error
      if (lastError.includes('403') || lastError.includes('429') || lastError.includes('challenge')) {
        // Bot detection - will retry with backoff
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

// --- Helpers ---
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
