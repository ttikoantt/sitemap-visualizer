import { describe, it, expect } from 'vitest';
import { isPathAllowed, clearRobotsCache } from '../robots-parser';

describe('isPathAllowed', () => {
  it('allows paths not in disallow list', () => {
    const rules = { disallowed: ['/admin/', '/private/'], crawlDelay: null };
    expect(isPathAllowed(rules, '/products/123')).toBe(true);
    expect(isPathAllowed(rules, '/about')).toBe(true);
  });

  it('blocks disallowed paths', () => {
    const rules = { disallowed: ['/admin/', '/private/'], crawlDelay: null };
    expect(isPathAllowed(rules, '/admin/dashboard')).toBe(false);
    expect(isPathAllowed(rules, '/private/data')).toBe(false);
  });

  it('allows everything when disallow list is empty', () => {
    const rules = { disallowed: [], crawlDelay: null };
    expect(isPathAllowed(rules, '/anything')).toBe(true);
  });

  it('blocks exact path match', () => {
    const rules = { disallowed: ['/secret'], crawlDelay: null };
    expect(isPathAllowed(rules, '/secret')).toBe(false);
    expect(isPathAllowed(rules, '/secret/page')).toBe(false);
    expect(isPathAllowed(rules, '/secrets')).toBe(false); // prefix match
  });
});

describe('clearRobotsCache', () => {
  it('does not throw', () => {
    expect(() => clearRobotsCache()).not.toThrow();
  });
});
