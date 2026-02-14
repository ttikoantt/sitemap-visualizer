import { Handle, Position } from '@xyflow/react';
import type { SitemapNodeData, PatternGroup } from '../types';
import { UNGROUPED_COLOR } from '../constants/colors';

const PAGE_TYPE_ICONS: Record<string, string> = {
  listing: '\u2630',    // ☰ list icon
  detail: '\u25A1',     // □ document
  static: '\u25CB',     // ○ pin
  pagination: '\u2026', // … ellipsis
  unknown: '\u2013',    // – dash
};

const PAGE_TYPE_LABELS: Record<string, string> = {
  listing: '一覧',
  detail: '詳細',
  static: '固定',
  pagination: 'ページネーション',
  unknown: '不明',
};

export function URLNode({ data }: { data: SitemapNodeData }) {
  const patternGroup = data.patternGroup as PatternGroup | undefined;
  const borderColor = patternGroup?.color ?? UNGROUPED_COLOR;

  return (
    <div
      style={{
        width: 200,
        padding: '10px 12px',
        borderRadius: 8,
        background: '#ffffff',
        border: `1px solid #e0e0e0`,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
          {data.label}
        </span>
        <span style={{ fontSize: 11, color: '#666' }} title={PAGE_TYPE_LABELS[data.pageType]}>
          {PAGE_TYPE_ICONS[data.pageType]} {PAGE_TYPE_LABELS[data.pageType]}
        </span>
      </div>

      <a
        href={data.url as string}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ color: '#4A90D9', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}
        title={data.url as string}
      >
        {data.url as string}
      </a>

      {data.urlCount > 1 && (
        <div style={{
          marginTop: 6,
          display: 'inline-block',
          background: borderColor + '20',
          color: borderColor,
          padding: '2px 6px',
          borderRadius: 10,
          fontSize: 10,
          fontWeight: 600,
        }}>
          {data.urlCount} ページ
        </div>
      )}

      {patternGroup && (
        <div style={{
          marginTop: 4,
          color: '#888',
          fontSize: 10,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {patternGroup.displayPattern}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
