import { extractURLsFromCSVContent } from './file-parser';

export interface ProjectEntry {
  id: string;
  name: string;
  description?: string;
}

interface ProjectIndex {
  projects: ProjectEntry[];
}

export async function fetchProjectList(): Promise<ProjectEntry[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/index.json`);
  if (!res.ok) throw new Error(`案件一覧の取得に失敗: ${res.status}`);
  const data: ProjectIndex = await res.json();
  return data.projects;
}

export async function fetchProjectCSV(projectId: string): Promise<string[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${projectId}/urls.csv`);
  if (!res.ok) throw new Error(`CSVの取得に失敗: ${projectId} (${res.status})`);
  const text = await res.text();
  return extractURLsFromCSVContent(text);
}

export interface ScreenshotManifest {
  generatedAt: string;
  snapshots: Record<string, {
    screenshotPath: string;
    metadata?: {
      title?: string;
      description?: string;
      h1?: string;
      ogImage?: string;
      ogTitle?: string;
      ogDescription?: string;
    };
    domStructure?: { tag: string; children: unknown[] };
    domFingerprint?: string;
  }>;
}

export async function fetchScreenshotManifest(projectId: string): Promise<ScreenshotManifest | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/${projectId}/screenshots.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
