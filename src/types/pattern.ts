import type { ParsedURL } from './url-tree';

export type PageType = 'listing' | 'detail' | 'static' | 'pagination' | 'unknown';

export type DynamicSegmentType = 'numeric' | 'uuid' | 'date' | 'slug' | 'mixed';

export interface SegmentAnalysis {
  position: number;
  type: 'static' | 'dynamic';
  staticValue?: string;
  dynamicType?: DynamicSegmentType;
  sampleValues?: string[];
  uniqueCount?: number;
}

export interface PatternExplanation {
  summary: string;
  pageType: PageType;
  pageTypeReason: string;
  segments: SegmentAnalysis[];
}

export interface PatternGroup {
  id: string;
  pattern: string;
  displayPattern: string;
  color: string;
  urls: ParsedURL[];
  explanation: PatternExplanation;
}
