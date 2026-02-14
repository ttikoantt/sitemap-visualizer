// Simple robots.txt parser for checking crawl permissions

interface RobotsRules {
  disallowed: string[];
  crawlDelay: number | null;
}

const robotsCache = new Map<string, RobotsRules>();

export async function fetchRobotsTxt(hostname: string): Promise<RobotsRules> {
  const cached = robotsCache.get(hostname);
  if (cached) return cached;

  const rules: RobotsRules = { disallowed: [], crawlDelay: null };

  try {
    const res = await fetch(`https://${hostname}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      robotsCache.set(hostname, rules);
      return rules;
    }

    const text = await res.text();
    let inUserAgentAll = false;

    for (const line of text.split('\n')) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.slice('user-agent:'.length).trim();
        inUserAgentAll = agent === '*';
      } else if (inUserAgentAll) {
        if (trimmed.startsWith('disallow:')) {
          const path = trimmed.slice('disallow:'.length).trim();
          if (path) rules.disallowed.push(path);
        } else if (trimmed.startsWith('crawl-delay:')) {
          const delay = parseFloat(trimmed.slice('crawl-delay:'.length).trim());
          if (!isNaN(delay)) rules.crawlDelay = delay;
        }
      }
    }
  } catch {
    // Network error - allow crawling but note failure
  }

  robotsCache.set(hostname, rules);
  return rules;
}

export function isPathAllowed(rules: RobotsRules, pathname: string): boolean {
  for (const disallowed of rules.disallowed) {
    if (pathname.startsWith(disallowed)) return false;
  }
  return true;
}

export function clearRobotsCache(): void {
  robotsCache.clear();
}
