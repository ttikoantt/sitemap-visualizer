import { useSitemapStore } from '../store/sitemap-store';

export function PatternLegend() {
  const patternGroups = useSitemapStore((s) => s.patternGroups);

  if (patternGroups.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 12,
      padding: '14px 18px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      zIndex: 5,
      maxWidth: 300,
      maxHeight: 320,
      overflow: 'auto',
      fontSize: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        fontWeight: 700, fontSize: 12, color: '#555', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>デザインパターン</span>
        <span style={{
          background: '#f0f0f0', padding: '2px 8px', borderRadius: 10,
          fontSize: 11, fontWeight: 600, color: '#888',
        }}>
          {patternGroups.length}
        </span>
      </div>
      {patternGroups.map((group) => (
        <div
          key={group.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 8px',
            borderRadius: 6,
          }}
        >
          <div style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            background: group.color,
            flexShrink: 0,
            boxShadow: `0 0 0 1px ${group.color}30`,
          }} />
          <span style={{ color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
            {group.displayPattern}
          </span>
          <span style={{ color: '#aaa', fontSize: 11, flexShrink: 0 }}>
            ({group.urls.length})
          </span>
        </div>
      ))}
    </div>
  );
}
