import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';

const DATA_DIR = path.resolve('public/data');
const VIEWPORT = { width: 1280, height: 900 };
const TIMEOUT = 30000;
const DELAY_BETWEEN_PAGES = 2000;

interface ProjectEntry {
  id: string;
  name: string;
  description?: string;
}

interface PageMetadata {
  title?: string;
  description?: string;
  h1?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

interface DomNode {
  tag: string;
  children: DomNode[];
  classNames?: string[];
  id?: string;
}

interface SnapshotEntry {
  screenshotPath: string;
  metadata: PageMetadata;
  domStructure: DomNode;
  domFingerprint: string;
}

interface Manifest {
  generatedAt: string;
  snapshots: Record<string, SnapshotEntry>;
}

function urlToSlug(url: string): string {
  try {
    const u = new URL(url);
    const slug = u.pathname
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .replace(/\//g, '_')
      || 'index';
    return slug.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  } catch {
    return 'unknown';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateFingerprint(dom: DomNode): string {
  function serialize(node: DomNode): string {
    const childStr = node.children.map(serialize).join(',');
    return `${node.tag}(${childStr})`;
  }
  const serialized = serialize(dom);
  let hash = 0;
  for (let i = 0; i < serialized.length; i++) {
    const char = serialized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

async function loadProjects(): Promise<ProjectEntry[]> {
  const indexPath = path.join(DATA_DIR, 'index.json');
  const content = await fs.readFile(indexPath, 'utf-8');
  const data = JSON.parse(content);
  return data.projects;
}

async function loadURLs(projectId: string): Promise<string[]> {
  const csvPath = path.join(DATA_DIR, projectId, 'urls.csv');
  const content = await fs.readFile(csvPath, 'utf-8');

  const parsed = Papa.parse<string[]>(content, { header: false, skipEmptyLines: true });
  const rows = parsed.data;
  if (rows.length === 0) return [];

  // Skip header if first row doesn't look like URL
  const startIdx = rows[0][0]?.startsWith('http') ? 0 : 1;
  return rows.slice(startIdx).map((row) => row[0]?.trim()).filter(Boolean);
}

async function main() {
  const projects = await loadProjects();
  console.log(`Found ${projects.length} project(s)`);

  const browser = await chromium.launch();

  for (const project of projects) {
    console.log(`\n--- Processing: ${project.name} (${project.id}) ---`);

    const urls = await loadURLs(project.id);
    console.log(`  ${urls.length} URLs to process`);

    const screenshotsDir = path.join(DATA_DIR, project.id, 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    const manifest: Manifest = {
      generatedAt: new Date().toISOString(),
      snapshots: {},
    };

    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const slug = urlToSlug(url);
      const screenshotFile = `${slug}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotFile);

      console.log(`  [${i + 1}/${urls.length}] ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await page.waitForTimeout(1000); // Extra wait for JS rendering

        // Take screenshot
        await page.screenshot({ path: screenshotPath, fullPage: false });

        // Extract metadata
        const metadata: PageMetadata = await page.evaluate(() => {
          const getMeta = (name: string) => {
            const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return el?.getAttribute('content') || undefined;
          };
          return {
            title: document.title || undefined,
            description: getMeta('description'),
            h1: document.querySelector('h1')?.textContent?.trim() || undefined,
            ogImage: getMeta('og:image'),
            ogTitle: getMeta('og:title'),
            ogDescription: getMeta('og:description'),
          };
        });

        // Extract DOM structure
        const domStructure: DomNode = await page.evaluate(() => {
          const SEMANTIC_TAGS = new Set([
            'header', 'nav', 'main', 'article', 'section', 'aside',
            'footer', 'form', 'table', 'ul', 'ol', 'dl', 'figure',
            'details', 'dialog', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          ]);

          function walk(element: Element): { tag: string; children: ReturnType<typeof walk>[]; classNames?: string[]; id?: string } | null {
            const tag = element.tagName.toLowerCase();
            const children: ReturnType<typeof walk>[] = [];

            for (const child of element.children) {
              const result = walk(child);
              if (result) children.push(result);
            }

            const isSemantic = SEMANTIC_TAGS.has(tag);
            const hasSemanticChildren = children.length > 0;
            const hasId = !!element.id;
            const classNames = Array.from(element.classList).filter((c) =>
              !c.match(/^(js-|is-|has-|u-|v-|ng-)/)
            );

            if (isSemantic || hasSemanticChildren || hasId || tag === 'body') {
              return {
                tag,
                children: children.filter((c): c is NonNullable<typeof c> => c !== null),
                ...(classNames.length > 0 ? { classNames } : {}),
                ...(hasId ? { id: element.id } : {}),
              };
            }

            if (tag === 'div' && children.length > 0) {
              return { tag, children: children.filter((c): c is NonNullable<typeof c> => c !== null) };
            }

            return children.length === 1 ? children[0] : null;
          }

          return walk(document.body) ?? { tag: 'body', children: [] };
        });

        manifest.snapshots[url] = {
          screenshotPath: `screenshots/${screenshotFile}`,
          metadata,
          domStructure: domStructure as DomNode,
          domFingerprint: generateFingerprint(domStructure as DomNode),
        };

        console.log(`    OK: ${metadata.title || '(no title)'}`);

      } catch (e) {
        console.error(`    ERROR: ${(e as Error).message}`);
      }

      if (i < urls.length - 1) {
        await sleep(DELAY_BETWEEN_PAGES);
      }
    }

    await context.close();

    // Write manifest
    const manifestPath = path.join(DATA_DIR, project.id, 'screenshots.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`  Manifest written: ${manifestPath}`);
    console.log(`  ${Object.keys(manifest.snapshots).length}/${urls.length} screenshots captured`);
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
