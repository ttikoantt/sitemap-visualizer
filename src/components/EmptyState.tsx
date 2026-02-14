import { FileUploader } from './FileUploader';
import { ProjectSelector } from './ProjectSelector';
import { useSitemapStore } from '../store/sitemap-store';

export function EmptyState() {
  const isLoading = useSitemapStore((s) => s.isLoading);
  const loadingMessage = useSitemapStore((s) => s.loadingMessage);
  const error = useSitemapStore((s) => s.error);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: 40,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
        Sitemap Visualizer
      </h1>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 32, textAlign: 'center', maxWidth: 480 }}>
        URLリスト（CSV / Excel）をアップロードして、インタラクティブなビジュアルサイトマップを生成します。
        ページパターンの自動分類と階層構造の可視化が可能です。
      </p>

      <ProjectSelector />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', maxWidth: 500, marginBottom: 20,
        color: '#ccc', fontSize: 13,
      }}>
        <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
        <span>または</span>
        <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 500, marginBottom: 20 }}>
        <FileUploader />
      </div>

      {isLoading && (
        <div style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
          {loadingMessage || '処理中...'}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, color: '#DE3618', fontSize: 14, background: '#fef2f2', padding: '8px 16px', borderRadius: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
