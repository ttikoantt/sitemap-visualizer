import { useSitemapStore } from '../store/sitemap-store';
import { useScreenshotStore } from '../store/screenshot-store';

const BTN_STYLE = {
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 11,
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
      borderRadius: 8,
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      zIndex: 5,
      fontSize: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      flexWrap: 'wrap',
    }}>
      {displayName && (
        <span style={{ color: '#666' }}>
          {displayName} ({parsedURLs.length} URL, {patternGroups.length} パターン)
        </span>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => setLayoutDirection('DOWN')}
          style={{
            ...BTN_STYLE,
            background: layoutDirection === 'DOWN' ? '#4A90D9' : '#fff',
            color: layoutDirection === 'DOWN' ? '#fff' : '#666',
          }}
        >
          縦
        </button>
        <button
          onClick={() => setLayoutDirection('RIGHT')}
          style={{
            ...BTN_STYLE,
            background: layoutDirection === 'RIGHT' ? '#4A90D9' : '#fff',
            color: layoutDirection === 'RIGHT' ? '#fff' : '#666',
          }}
        >
          横
        </button>
      </div>

      <div style={{ width: 1, height: 20, background: '#e0e0e0' }} />

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

      <button onClick={reset} style={{ ...BTN_STYLE, color: '#888' }}>
        リセット
      </button>
    </div>
  );
}
