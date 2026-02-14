import { describe, it, expect } from 'vitest';
import { parseURL, parseURLList } from '../url-parser';

describe('parseURL', () => {
  it('parses a standard URL correctly', () => {
    const result = parseURL('https://example.com/products/123');
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe('example.com');
    expect(result!.pathname).toBe('/products/123');
    expect(result!.segments).toEqual(['products', '123']);
  });

  it('handles URL without protocol', () => {
    const result = parseURL('example.com/about');
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe('example.com');
    expect(result!.segments).toEqual(['about']);
  });

  it('handles URL with www prefix', () => {
    const result = parseURL('https://www.example.com/page');
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe('www.example.com');
    expect(result!.segments).toEqual(['page']);
  });

  it('handles URL with query string and hash', () => {
    const result = parseURL('https://example.com/search?q=test#results');
    expect(result).not.toBeNull();
    expect(result!.query).toBe('?q=test');
    expect(result!.hash).toBe('#results');
    expect(result!.segments).toEqual(['search']);
  });

  it('normalizes trailing slashes', () => {
    const result = parseURL('https://example.com/products/');
    expect(result).not.toBeNull();
    expect(result!.pathname).toBe('/products');
    expect(result!.segments).toEqual(['products']);
  });

  it('lowercases hostname', () => {
    const result = parseURL('https://Example.COM/Page');
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe('example.com');
    // pathname should preserve case
    expect(result!.segments).toEqual(['Page']);
  });

  it('returns empty segments for root URL', () => {
    const result = parseURL('https://example.com/');
    expect(result).not.toBeNull();
    expect(result!.segments).toEqual([]);
    expect(result!.pathname).toBe('/');
  });

  it('returns null for empty string', () => {
    expect(parseURL('')).toBeNull();
  });

  it('returns null for whitespace only', () => {
    expect(parseURL('   ')).toBeNull();
  });

  it('returns null for malformed URL', () => {
    expect(parseURL('not a url at all !!!')).toBeNull();
  });

  it('handles URL-encoded characters', () => {
    const result = parseURL('https://example.com/path/hello%20world');
    expect(result).not.toBeNull();
    expect(result!.segments).toEqual(['path', 'hello world']);
  });

  it('handles URL with port', () => {
    const result = parseURL('https://example.com:8080/api/v1');
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe('example.com:8080');
    expect(result!.segments).toEqual(['api', 'v1']);
  });

  it('preserves original URL', () => {
    const original = 'https://example.com/products/123?ref=home';
    const result = parseURL(original);
    expect(result).not.toBeNull();
    expect(result!.original).toBe(original);
  });

  it('handles deep nesting', () => {
    const result = parseURL('https://example.com/a/b/c/d/e/f/g');
    expect(result).not.toBeNull();
    expect(result!.segments).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });
});

describe('parseURLList', () => {
  it('parses a list of valid URLs', () => {
    const urls = [
      'https://example.com/page1',
      'https://example.com/page2',
    ];
    const result = parseURLList(urls);
    expect(result).toHaveLength(2);
    expect(result[0].segments).toEqual(['page1']);
    expect(result[1].segments).toEqual(['page2']);
  });

  it('filters out empty strings', () => {
    const urls = ['https://example.com/page1', '', '  ', 'https://example.com/page2'];
    const result = parseURLList(urls);
    expect(result).toHaveLength(2);
  });

  it('deduplicates URLs', () => {
    const urls = [
      'https://example.com/page',
      'https://example.com/page',
      'https://example.com/page/',
    ];
    const result = parseURLList(urls);
    expect(result).toHaveLength(1);
  });

  it('filters out malformed URLs', () => {
    const urls = [
      'https://example.com/valid',
      'not a url',
      'https://example.com/also-valid',
    ];
    const result = parseURLList(urls);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(parseURLList([])).toEqual([]);
  });
});
