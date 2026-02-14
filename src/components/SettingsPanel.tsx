import { useScreenshotStore } from '../store/screenshot-store';
import { useSitemapStore } from '../store/sitemap-store';

export function SettingsPanel() {
  const showSettings = useScreenshotStore((s) => s.showSettings);
  const setShowSettings = useScreenshotStore((s) => s.setShowSettings);
  const snapshots = useScreenshotStore((s) => s.snapshots);
  const manifestLoaded = useScreenshotStore((s) => s.manifestLoaded);
  const manifestGeneratedAt = useScreenshotStore((s) => s.manifestGeneratedAt);
  const loadManifest = useScreenshotStore((s) => s.loadManifest);
  const currentProject = useSitemapStore((s) => s.currentProject);

  if (!showSettings) return null;

  const successCount = Array.from(snapshots.values()).filter((s) => s.status === 'success').length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
    }}
      onClick={() => setShowSettings(false)}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '24px 32px',
          width: 440,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            スクリーンショット情報
          </h2>
          <button
            onClick={() => setShowSettings(false)}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <div>
            <span style={{ color: '#888' }}>ステータス: </span>
            {manifestLoaded ? (
              <span style={{ color: '#2e7d32', fontWeight: 600 }}>読み込み済み</span>
            ) : (
              <span style={{ color: '#999' }}>未読み込み</span>
            )}
          </div>
          <div>
            <span style={{ color: '#888' }}>スクリーンショット数: </span>
            <span style={{ fontWeight: 600 }}>{successCount}</span>
          </div>
          {manifestGeneratedAt && (
            <div>
              <span style={{ color: '#888' }}>最終生成日時: </span>
              <span>{new Date(manifestGeneratedAt).toLocaleString('ja-JP')}</span>
            </div>
          )}
        </div>

        <div style={{
          marginTop: 20,
          padding: '12px 16px',
          background: '#f6f8fa',
          borderRadius: 8,
          fontSize: 12,
          color: '#555',
          lineHeight: 1.8,
        }}>
          <strong>スクリーンショットの生成方法</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li>GitHub Actions で Playwright が自動的にスクリーンショットを取得します</li>
            <li>CSVファイルを更新してプッシュすると自動実行されます</li>
            <li>手動実行: Actions タブ → Take Screenshots → Run workflow</li>
            <li>ローカル: <code>npm run screenshots</code></li>
          </ul>
        </div>

        {currentProject && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={() => loadManifest(currentProject.id)}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #4A90D9',
                background: '#f0f7ff',
                color: '#4A90D9',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              マニフェスト再読み込み
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fff',
              color: '#666',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
