export interface ScreenshotConfig {
  enabled: boolean;
  rateLimit: number; // ms between requests
  respectRobotsTxt: boolean;
  maxRetries: number;
  timeout: number; // ms
}

export interface PageMetadata {
  title?: string;
  description?: string;
  h1?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export interface DomStructure {
  tag: string;
  children: DomStructure[];
  classNames?: string[];
  id?: string;
}

export interface PageSnapshot {
  url: string;
  screenshotUrl?: string; // og:image URL
  screenshotBase64?: string;
  metadata?: PageMetadata;
  domStructure?: DomStructure;
  domFingerprint?: string; // hash of dom structure
  fetchedAt?: number;
  error?: string;
  status: 'pending' | 'fetching' | 'success' | 'error' | 'blocked';
}

export interface VisualPatternGroup {
  id: string;
  label: string;
  color: string;
  ssimThreshold: number;
  domSimilarity: number;
  urls: string[];
  representativeScreenshot?: string;
  explanation: string;
}
