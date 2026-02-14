import Papa from 'papaparse';

const URL_COLUMN_NAMES = ['url', 'address', 'link', 'href', 'page_url', 'page'];

export function detectURLColumn(headers: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());

  // Exact match first
  for (const name of URL_COLUMN_NAMES) {
    const idx = lower.indexOf(name);
    if (idx !== -1) return idx;
  }

  // Substring match
  for (let i = 0; i < lower.length; i++) {
    if (lower[i].includes('url') || lower[i].includes('link') || lower[i].includes('href')) {
      return i;
    }
  }

  return 0; // Default to first column
}

function looksLikeURL(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('www.') ||
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+\//i.test(trimmed)
  );
}

function isHeaderRow(row: string[]): boolean {
  // If no cell looks like a URL, it's likely a header
  return !row.some((cell) => looksLikeURL(cell));
}

export function extractURLsFromCSVContent(content: string): string[] {
  if (!content.trim()) return [];

  const parsed = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  if (rows.length === 0) return [];

  // Determine if first row is header
  const firstRow = rows[0];
  let dataStartIndex = 0;
  let urlColumnIndex = 0;

  if (isHeaderRow(firstRow)) {
    urlColumnIndex = detectURLColumn(firstRow);
    dataStartIndex = 1;
  }

  const urls: string[] = [];
  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i];
    const cell = row[urlColumnIndex]?.trim();
    if (cell) {
      urls.push(cell);
    }
  }

  return urls;
}

export async function parseFile(file: File): Promise<string[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
    const text = await file.text();
    return extractURLsFromCSVContent(text);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const { read, utils } = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const csv = utils.sheet_to_csv(firstSheet);
    return extractURLsFromCSVContent(csv);
  }

  throw new Error(`Unsupported file type: .${extension}`);
}
