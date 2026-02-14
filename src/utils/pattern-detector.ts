import type {
  URLTreeNode,
  ParsedURL,
  PatternGroup,
  PatternExplanation,
  SegmentAnalysis,
  DynamicSegmentType,
  PageType,
} from '../types';
import { getPatternColor } from '../constants/colors';

const MIN_GROUP_SIZE = 2;
const STATIC_GROUP_MIN_SIZE = 3;

const LISTING_KEYWORDS = ['list', 'index', 'archive', 'category', 'tag', 'search', 'categories', 'tags'];
const DETAIL_KEYWORDS = ['detail', 'item', 'view', 'post', 'article'];
const PAGINATION_PARENT_KEYWORDS = ['page', 'p'];

// --- Segment Classification ---

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;
const YEAR_RE = /^(19|20)\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)+$/i;

export function classifySegment(values: string[]): DynamicSegmentType {
  if (values.every((v) => NUMERIC_RE.test(v))) {
    // Check if they look like years
    if (values.every((v) => YEAR_RE.test(v))) return 'date';
    return 'numeric';
  }
  if (values.every((v) => UUID_RE.test(v))) return 'uuid';
  if (values.every((v) => SLUG_RE.test(v))) return 'slug';
  // Check majority
  const slugCount = values.filter((v) => SLUG_RE.test(v)).length;
  if (slugCount / values.length > 0.7) return 'slug';
  return 'mixed';
}

function isDynamicSegmentValue(value: string): boolean {
  return NUMERIC_RE.test(value) || UUID_RE.test(value) || SLUG_RE.test(value);
}

// --- Page Type Classification ---

export function classifyPageType(
  node: URLTreeNode,
  siblingCount: number = 1,
  parentSegment: string = '',
): { pageType: PageType; reason: string } {
  const seg = node.segment.toLowerCase();

  // Pagination: parent is "page" and segment is numeric
  if (PAGINATION_PARENT_KEYWORDS.includes(parentSegment.toLowerCase()) && NUMERIC_RE.test(seg)) {
    return { pageType: 'pagination', reason: 'ページネーションパターン（/page/{number}）と一致' };
  }

  // Has children → listing/category
  if (node.children.length > 0) {
    return { pageType: 'listing', reason: `子ページを${node.children.length}件持つため、一覧/カテゴリページと判定` };
  }

  // Leaf node analysis
  if (node.urls.length > 0) {
    // Check for listing keywords in path
    const pathSegments = node.fullPath.toLowerCase().split('/').filter(Boolean);
    if (pathSegments.some((s) => LISTING_KEYWORDS.includes(s))) {
      return { pageType: 'listing', reason: `パス内に一覧系キーワードを含む` };
    }

    // Many siblings with dynamic segments → detail
    if (siblingCount >= MIN_GROUP_SIZE && isDynamicSegmentValue(node.segment)) {
      return { pageType: 'detail', reason: `同じ親配下に${siblingCount}件の類似ページがあり、動的セグメント（${node.segment}）で終端するため詳細ページと判定` };
    }

    // Check for detail keywords
    if (pathSegments.some((s) => DETAIL_KEYWORDS.includes(s))) {
      return { pageType: 'detail', reason: `パス内に詳細系キーワードを含む` };
    }

    // Static-looking leaf (no dynamic segment, few siblings)
    if (!isDynamicSegmentValue(node.segment) && siblingCount <= 2) {
      return { pageType: 'static', reason: `静的なセグメント名で、兄弟ページが少ないため固定ページと判定` };
    }

    if (isDynamicSegmentValue(node.segment)) {
      return { pageType: 'detail', reason: `動的セグメント（${node.segment}）で終端するため詳細ページと判定` };
    }
  }

  return { pageType: 'unknown', reason: '判定条件に該当しないため不明' };
}

// --- Pattern Detection ---

interface RawGroup {
  parentPath: string;
  parentSegment: string;
  segmentValues: string[];
  urls: ParsedURL[];
  childrenStructures: Map<string, URLTreeNode[]>;
}

function getDynamicSegmentLabel(type: DynamicSegmentType): string {
  switch (type) {
    case 'numeric': return '{id}';
    case 'uuid': return '{uuid}';
    case 'date': return '{year}';
    case 'slug': return '{slug}';
    case 'mixed': return '{name}';
  }
}

function collectGroups(node: URLTreeNode, groups: RawGroup[], _parentSegment: string = ''): void {
  if (node.children.length < MIN_GROUP_SIZE) {
    // Recurse into children
    for (const child of node.children) {
      collectGroups(child, groups, node.segment);
    }
    return;
  }

  // Separate static-looking vs dynamic-looking children
  const dynamicChildren: URLTreeNode[] = [];
  const staticChildren: URLTreeNode[] = [];

  for (const child of node.children) {
    if (isDynamicSegmentValue(child.segment)) {
      dynamicChildren.push(child);
    } else {
      staticChildren.push(child);
    }
  }

  // If enough dynamic children, form a group
  if (dynamicChildren.length >= MIN_GROUP_SIZE) {
    const segmentValues = dynamicChildren.map((c) => c.segment);
    const urls: ParsedURL[] = [];

    // Collect all URLs from dynamic children (including their descendants)
    function collectURLs(n: URLTreeNode): void {
      urls.push(...n.urls);
      for (const child of n.children) {
        collectURLs(child);
      }
    }

    for (const child of dynamicChildren) {
      collectURLs(child);
    }

    if (urls.length >= MIN_GROUP_SIZE) {
      groups.push({
        parentPath: node.fullPath || `/${node.segment}`,
        parentSegment: node.segment,
        segmentValues,
        urls,
        childrenStructures: new Map(),
      });
    }
  }

  // Group static leaves if enough siblings under a non-root parent
  const staticLeaves = staticChildren.filter((c) => c.children.length === 0 && c.urls.length > 0);
  if (staticLeaves.length >= STATIC_GROUP_MIN_SIZE && node.depth >= 1) {
    const segmentValues = staticLeaves.map((c) => c.segment);
    const urls = staticLeaves.flatMap((c) => c.urls);
    if (urls.length >= STATIC_GROUP_MIN_SIZE) {
      groups.push({
        parentPath: node.fullPath || `/${node.segment}`,
        parentSegment: node.segment,
        segmentValues,
        urls,
        childrenStructures: new Map(),
      });
    }
  }

  // Recurse into static children (they may have dynamic sub-groups)
  for (const child of staticChildren) {
    collectGroups(child, groups, node.segment);
  }

  // Also recurse into dynamic children to find nested patterns
  for (const child of dynamicChildren) {
    collectGroups(child, groups, node.segment);
  }
}

function buildSegmentAnalysis(parentPath: string, segmentValues: string[]): SegmentAnalysis[] {
  const parentSegments = parentPath.split('/').filter(Boolean);
  const analyses: SegmentAnalysis[] = [];

  for (let i = 0; i < parentSegments.length; i++) {
    analyses.push({
      position: i,
      type: 'static',
      staticValue: parentSegments[i],
    });
  }

  const dynamicType = classifySegment(segmentValues);
  const uniqueValues = [...new Set(segmentValues)];
  analyses.push({
    position: parentSegments.length,
    type: 'dynamic',
    dynamicType,
    sampleValues: uniqueValues.slice(0, 5),
    uniqueCount: uniqueValues.length,
  });

  return analyses;
}

function generateExplanation(
  group: RawGroup,
  segments: SegmentAnalysis[],
): PatternExplanation {
  const dynamicSeg = segments.find((s) => s.type === 'dynamic');
  const typeLabel = dynamicSeg?.dynamicType === 'numeric' ? '数値ID'
    : dynamicSeg?.dynamicType === 'uuid' ? 'UUID'
    : dynamicSeg?.dynamicType === 'date' ? '年（4桁の数字）'
    : dynamicSeg?.dynamicType === 'slug' ? 'テキストスラッグ'
    : '固定名ページ';

  const samples = dynamicSeg?.sampleValues?.slice(0, 3).join(', ') ?? '';

  const isPagination = PAGINATION_PARENT_KEYWORDS.includes(
    group.parentPath.split('/').filter(Boolean).pop()?.toLowerCase() ?? ''
  );

  let pageType: PageType;
  let pageTypeReason: string;

  if (isPagination) {
    pageType = 'pagination';
    pageTypeReason = 'ページネーションパターン（/page/{number}）と一致';
  } else {
    pageType = 'detail';
    pageTypeReason = `${group.parentPath}/ 配下に${group.urls.length}件の動的ページがあるため詳細ページと判定`;
  }

  const summary = `これらの${group.urls.length}件のURLは ${group.parentPath}/ の後に${typeLabel}が続くパターンです（例: ${samples}）。`;

  return {
    summary,
    pageType,
    pageTypeReason,
    segments,
  };
}

export function detectPatterns(root: URLTreeNode): PatternGroup[] {
  const rawGroups: RawGroup[] = [];
  collectGroups(root, rawGroups);

  const patternGroups: PatternGroup[] = [];
  let colorIndex = 0;

  for (const group of rawGroups) {
    const segments = buildSegmentAnalysis(group.parentPath, group.segmentValues);
    const dynamicSeg = segments.find((s) => s.type === 'dynamic');
    const label = dynamicSeg ? getDynamicSegmentLabel(dynamicSeg.dynamicType!) : '{param}';
    const pattern = `${group.parentPath}/${label}`;
    const explanation = generateExplanation(group, segments);

    patternGroups.push({
      id: `pattern-${colorIndex}`,
      pattern,
      displayPattern: pattern,
      color: getPatternColor(colorIndex),
      urls: group.urls,
      explanation,
    });

    colorIndex++;
  }

  return patternGroups;
}
