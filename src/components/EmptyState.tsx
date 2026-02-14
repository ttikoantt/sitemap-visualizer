import { FileUploader } from './FileUploader';
import { useSitemapStore } from '../store/sitemap-store';

const SAMPLE_URLS = [
  'https://example.com/',
  'https://example.com/about',
  'https://example.com/contact',
  'https://example.com/products',
  'https://example.com/products/1',
  'https://example.com/products/2',
  'https://example.com/products/3',
  'https://example.com/products/4',
  'https://example.com/products/5',
  'https://example.com/products/category/shoes',
  'https://example.com/products/category/hats',
  'https://example.com/products/category/shirts',
  'https://example.com/blog',
  'https://example.com/blog/2024/01/new-year-post',
  'https://example.com/blog/2024/02/february-update',
  'https://example.com/blog/2024/03/spring-sale',
  'https://example.com/blog/2023/12/year-review',
  'https://example.com/blog/2023/11/black-friday',
  'https://example.com/blog/page/1',
  'https://example.com/blog/page/2',
  'https://example.com/blog/page/3',
  'https://example.com/faq',
  'https://example.com/privacy',
  'https://example.com/terms',
  'https://example.com/careers',
  'https://example.com/careers/engineer',
  'https://example.com/careers/designer',
  'https://example.com/careers/manager',
  'https://example.com/help',
  'https://example.com/help/getting-started',
  'https://example.com/help/billing',
  'https://example.com/help/faq',
];

export function EmptyState() {
  const processURLs = useSitemapStore((s) => s.processURLs);
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

      <div style={{ width: '100%', maxWidth: 500, marginBottom: 20 }}>
        <FileUploader />
      </div>

      <button
        onClick={() => processURLs(SAMPLE_URLS, 'sample-data.csv')}
        disabled={isLoading}
        style={{
          padding: '10px 24px',
          borderRadius: 8,
          border: '1px solid #4A90D9',
          background: '#fff',
          color: '#4A90D9',
          cursor: isLoading ? 'wait' : 'pointer',
          fontSize: 14,
          fontWeight: 600,
          transition: 'all 0.2s',
        }}
      >
        サンプルデータで試す
      </button>

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
