import { describe, it, expect } from 'vitest';
import { extractURLsFromCSVContent, detectURLColumn } from '../file-parser';

describe('detectURLColumn', () => {
  it('detects column named "url"', () => {
    const headers = ['id', 'url', 'title'];
    expect(detectURLColumn(headers)).toBe(1);
  });

  it('detects column named "URL" (case-insensitive)', () => {
    const headers = ['ID', 'URL', 'Title'];
    expect(detectURLColumn(headers)).toBe(1);
  });

  it('detects column named "address"', () => {
    const headers = ['name', 'address'];
    expect(detectURLColumn(headers)).toBe(1);
  });

  it('detects column named "link"', () => {
    const headers = ['page', 'link'];
    expect(detectURLColumn(headers)).toBe(1);
  });

  it('returns 0 (first column) if no URL column found', () => {
    const headers = ['col1', 'col2'];
    expect(detectURLColumn(headers)).toBe(0);
  });

  it('detects column containing "url" as substring', () => {
    const headers = ['page_url', 'status'];
    expect(detectURLColumn(headers)).toBe(0);
  });
});

describe('extractURLsFromCSVContent', () => {
  it('extracts URLs from simple CSV', () => {
    const csv = 'https://example.com/page1\nhttps://example.com/page2\n';
    const result = extractURLsFromCSVContent(csv);
    expect(result).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
    ]);
  });

  it('extracts URLs from CSV with headers', () => {
    const csv = 'url,status\nhttps://example.com/page1,200\nhttps://example.com/page2,301\n';
    const result = extractURLsFromCSVContent(csv);
    expect(result).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
    ]);
  });

  it('handles CSV with URL in non-first column', () => {
    const csv = 'id,url,title\n1,https://example.com/page1,Home\n2,https://example.com/page2,About\n';
    const result = extractURLsFromCSVContent(csv);
    expect(result).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
    ]);
  });

  it('filters empty rows', () => {
    const csv = 'https://example.com/page1\n\n\nhttps://example.com/page2\n';
    const result = extractURLsFromCSVContent(csv);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty content', () => {
    expect(extractURLsFromCSVContent('')).toEqual([]);
  });
});
