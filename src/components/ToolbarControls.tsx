import { useSitemapStore } from '../store/sitemap-store';
import { useScreenshotStore } from '../store/screenshot-store';

const BTN_STYLE: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 500,
  transition: 'background 0.15s, box-shadow 0.15s',
  lineHeight: '18px',
};

export function ToolbarControls() {
  const layoutDirection = useSitemapStore((s) => s.layoutDirection);
  const setLayoutDirection = useSitemapStore((s) => s.setLayoutDirection);
  const fileName = useSitemapStore((s) => s.fileName);
  const parsedURLs = useSitemapStore((s) => s.parsedURLs);
  const patternGroups = useSitemapStore((s) => s.patternGroups);
  const currentProject = useSitemapStore((s) => s.currentProject);
  const reset = useSitemapStore((s) => s.reset);

  const setShowSettings = useScreenshotStore((s) => s.setShowSettings);
  const classifyPatterns = useScreenshotStore((s) => s.classifyPatterns);
  const isClassifying = useScreenshotStore((s) => s.isClassifying);
  const snapshots = useScreenshotStore((s) => s.snapshots);
  const manifestLoaded = useScreenshotStore((s) => s.manifestLoaded);
  const loadManifest = useScreenshotStore((s) => s.loadManifest);
  const isFetching = useScreenshotStore((s) => s.isFetching);

  const successCount = Array.from(snapshots.values()).filter((s) => s.status === 'success').length;
  const displayName = currentProject?.name || fileName;

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: 12,
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 12,
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      zIndex: 5,
      fontSize: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      flexWrap: 'wrap',
    }}>
      {displayName && (
        <span style={{ color: '#555', fontWeight: 600, letterSpacing: -0.2 }}>
          {displayName}
        </span>
      )}

      {displayName && (
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            background: '#f0f4ff', color: '#4A90D9',
            padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
          }}>
            {parsedURLs.length} URL
          </span>
          <span style={{
            background: '#f0faf0', color: '#2e7d32',
            padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
          }}>
            {patternGroups.length} パターン
          </span>
        </div>
      )}

      <div style={{ width: 1, height: 22, background: '#e8e8e8' }} />

      <div style={{
        display: 'flex', gap: 2,
        background: '#f5f5f5', borderRadius: 8, padding: 2,
      }}>
        <button
          onClick={() => setLayoutDirection('DOWN')}
          style={{
            ...BTN_STYLE,
            border: 'none',
            padding: '4px 10px',
            borderRadius: 6,
            background: layoutDirection === 'DOWN' ? '#4A90D9' : 'transparent',
            color: layoutDirection === 'DOWN' ? '#fff' : '#888',
            fontWeight: 700,
            fontSize: 13,
          }}
          title="縦レイアウト"
        >
          ↓
        </button>
        <button
          onClick={() => setLayoutDirection('RIGHT')}
          style={{
            ...BTN_STYLE,
            border: 'none',
            padding: '4px 10px',
            borderRadius: 6,
            background: layoutDirection === 'RIGHT' ? '#4A90D9' : 'transparent',
            color: layoutDirection === 'RIGHT' ? '#fff' : '#888',
            fontWeight: 700,
            fontSize: 13,
          }}
          title="横レイアウト"
        >
          →
        </button>
      </div>

      <div style={{ width: 1, height: 22, background: '#e8e8e8' }} />

      <button
        onClick={() => setShowSettings(true)}
        style={{ ...BTN_STYLE, color: manifestLoaded ? '#2e7d32' : '#888' }}
      >
        {manifestLoaded ? `SS: ${successCount}件` : 'SS情報'}
      </button>

      {currentProject && !manifestLoaded && !isFetching && (
        <button
          onClick={() => loadManifest(currentProject.id)}
          style={{
            ...BTN_STYLE,
            background: '#f0f7ff',
            color: '#4A90D9',
            border: '1px solid #4A90D9',
          }}
        >
          SS読み込み
        </button>
      )}

      {successCount > 1 && (
        <button
          onClick={classifyPatterns}
          disabled={isClassifying}
          style={{
            ...BTN_STYLE,
            background: isClassifying ? '#f0f0f0' : '#e8f5e9',
            color: isClassifying ? '#999' : '#2e7d32',
            border: '1px solid #50B83C',
            cursor: isClassifying ? 'wait' : 'pointer',
          }}
        >
          {isClassifying ? '分類中...' : `ビジュアル分類 (${successCount}件)`}
        </button>
      )}

      <button onClick={reset} style={{ ...BTN_STYLE, color: '#999' }}>
        リセット
      </button>
    </div>
  );
}
