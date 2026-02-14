export interface ParsedURL {
  original: string;
  hostname: string;
  pathname: string;
  segments: string[];
  query: string;
  hash: string;
}

export interface URLTreeNode {
  segment: string;
  fullPath: string;
  children: URLTreeNode[];
  urls: ParsedURL[];
  depth: number;
}
