import { useSitemapStore } from '../store/sitemap-store';
import { UNGROUPED_COLOR } from '../constants/colors';

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
      borderRadius: 8,
      padding: '12px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      zIndex: 5,
      maxWidth: 280,
      maxHeight: 300,
      overflow: 'auto',
      fontSize: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ fontWeight: 600, fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        パターン凡例
      </div>
      {patternGroups.map((group) => (
        <div
          key={group.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 0',
          }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: group.color,
            flexShrink: 0,
          }} />
          <span style={{ color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.displayPattern}
          </span>
          <span style={{ color: '#aaa', fontSize: 11, flexShrink: 0 }}>
            ({group.urls.length})
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: UNGROUPED_COLOR, flexShrink: 0 }} />
        <span style={{ color: '#888' }}>グループなし</span>
      </div>
    </div>
  );
}
