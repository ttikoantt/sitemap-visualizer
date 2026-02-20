import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { SitemapNodeData, PatternGroup } from '../types';
import { UNGROUPED_COLOR } from '../constants/colors';

const PAGE_TYPE_LABELS: Record<string, string> = {
  listing: '一覧',
  detail: '詳細',
  static: '固定',
  pagination: 'ページ送り',
  unknown: '不明',
};

function WireframeThumbnail({ pageType, color }: { pageType: string; color: string }) {
  const bg = color + '08';
  const line = color + '30';
  const block = color + '18';

  switch (pageType) {
    case 'listing':
      return (
        <svg width="100%" height="48" viewBox="0 0 240 48" style={{ display: 'block' }}>
          <rect x="0" y="0" width="240" height="48" rx="4" fill={bg} />
          <rect x="8" y="4" width="108" height="7" rx="2" fill={line} />
          <rect x="8" y="16" width="52" height="26" rx="3" fill={block} />
          <rect x="66" y="16" width="52" height="26" rx="3" fill={block} />
          <rect x="124" y="16" width="52" height="26" rx="3" fill={block} />
          <rect x="182" y="16" width="52" height="26" rx="3" fill={block} />
        </svg>
      );
    case 'detail':
      return (
        <svg width="100%" height="48" viewBox="0 0 240 48" style={{ display: 'block' }}>
          <rect x="0" y="0" width="240" height="48" rx="4" fill={bg} />
          <rect x="8" y="4" width="140" height="7" rx="2" fill={line} />
          <rect x="8" y="16" width="155" height="4" rx="1" fill={block} />
          <rect x="8" y="24" width="135" height="4" rx="1" fill={block} />
          <rect x="8" y="32" width="148" height="4" rx="1" fill={block} />
          <rect x="8" y="40" width="115" height="4" rx="1" fill={block} />
          <rect x="178" y="16" width="54" height="28" rx="3" fill={block} />
        </svg>
      );
    case 'pagination':
      return (
        <svg width="100%" height="48" viewBox="0 0 240 48" style={{ display: 'block' }}>
          <rect x="0" y="0" width="240" height="48" rx="4" fill={bg} />
          <rect x="8" y="4" width="224" height="6" rx="2" fill={block} />
          <rect x="8" y="14" width="224" height="6" rx="2" fill={block} />
          <rect x="8" y="24" width="224" height="6" rx="2" fill={block} />
          <rect x="8" y="34" width="224" height="6" rx="2" fill={block} />
          <circle cx="100" cy="45" r="2.5" fill={line} />
          <circle cx="112" cy="45" r="2.5" fill={line} />
          <circle cx="124" cy="45" r="2.5" fill={line} />
          <circle cx="136" cy="45" r="2.5" fill={line} />
        </svg>
      );
    default: // static, unknown
      return (
        <svg width="100%" height="48" viewBox="0 0 240 48" style={{ display: 'block' }}>
          <rect x="0" y="0" width="240" height="48" rx="4" fill={bg} />
          <rect x="8" y="4" width="120" height="7" rx="2" fill={line} />
          <rect x="8" y="17" width="224" height="4" rx="1" fill={block} />
          <rect x="8" y="25" width="195" height="4" rx="1" fill={block} />
          <rect x="8" y="33" width="210" height="4" rx="1" fill={block} />
          <rect x="8" y="41" width="170" height="4" rx="1" fill={block} />
        </svg>
      );
  }
}

export function URLNode({ data, selected }: { data: SitemapNodeData; selected?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const patternGroup = data.patternGroup as PatternGroup | undefined;
  const accent = patternGroup?.color ?? UNGROUPED_COLOR;

  const shadow = selected
    ? `0 0 0 2px ${accent}, 0 4px 16px rgba(0,0,0,0.12)`
    : hovered
      ? '0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 260,
        borderRadius: 10,
        background: '#ffffff',
        border: `1px solid ${accent}30`,
        boxShadow: shadow,
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      {/* Color header bar */}
      <div style={{ height: 6, background: accent }} />

      {/* Card body */}
      <div style={{ padding: '10px 14px 12px' }}>
        {/* Title + page type badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{
            fontWeight: 700, fontSize: 14, color: '#1a1a1a', lineHeight: '20px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170,
          }}>
            {data.label}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: accent,
            background: accent + '15', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap',
          }}>
            {PAGE_TYPE_LABELS[data.pageType]}
          </span>
        </div>

        {/* Path */}
        <div style={{
          color: '#999', fontSize: 11, letterSpacing: -0.2, marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {data.fullPath}
        </div>

        {/* Wireframe thumbnail */}
        <WireframeThumbnail pageType={data.pageType} color={accent} />

        {/* Footer: count + pattern */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          {data.urlCount > 1 ? (
            <span style={{
              background: accent + '18', color: accent,
              padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
            }}>
              {data.urlCount} pages
            </span>
          ) : <span />}
          {patternGroup && (
            <span style={{
              color: '#bbb', fontSize: 9, maxWidth: 120,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {patternGroup.displayPattern}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
