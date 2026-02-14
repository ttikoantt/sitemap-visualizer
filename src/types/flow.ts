import type { PatternGroup, PageType } from './pattern';

export interface SitemapNodeData extends Record<string, unknown> {
  label: string;
  fullPath: string;
  urlCount: number;
  patternGroup?: PatternGroup;
  pageType: PageType;
  depth: number;
  isLeaf: boolean;
  isGrouped: boolean;
}
