import { useSitemapStore } from '../store/sitemap-store';

export function ToolbarControls() {
  const layoutDirection = useSitemapStore((s) => s.layoutDirection);
  const setLayoutDirection = useSitemapStore((s) => s.setLayoutDirection);
  const fileName = useSitemapStore((s) => s.fileName);
  const parsedURLs = useSitemapStore((s) => s.parsedURLs);
  const patternGroups = useSitemapStore((s) => s.patternGroups);
  const reset = useSitemapStore((s) => s.reset);

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: 12,
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      zIndex: 5,
      fontSize: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {fileName && (
        <span style={{ color: '#666' }}>
          {fileName} ({parsedURLs.length} URL, {patternGroups.length} パターン)
        </span>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => setLayoutDirection('DOWN')}
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid #ddd',
            background: layoutDirection === 'DOWN' ? '#4A90D9' : '#fff',
            color: layoutDirection === 'DOWN' ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          縦
        </button>
        <button
          onClick={() => setLayoutDirection('RIGHT')}
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid #ddd',
            background: layoutDirection === 'RIGHT' ? '#4A90D9' : '#fff',
            color: layoutDirection === 'RIGHT' ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          横
        </button>
      </div>

      <button
        onClick={reset}
        style={{
          padding: '4px 10px',
          borderRadius: 4,
          border: '1px solid #ddd',
          background: '#fff',
          color: '#888',
          cursor: 'pointer',
          fontSize: 11,
        }}
      >
        リセット
      </button>
    </div>
  );
}
