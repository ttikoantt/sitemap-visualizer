import { useScreenshotStore } from '../store/screenshot-store';
import type { FetchMethod } from '../types';

const METHODS: Array<{ value: FetchMethod; label: string; description: string }> = [
  { value: 'none', label: 'なし', description: 'スクリーンショット取得を無効にする' },
  { value: 'screenshotone', label: 'ScreenshotOne', description: 'ScreenshotOne API でスクショのみ取得' },
  { value: 'scrapingbee', label: 'ScrapingBee', description: 'ScrapingBee API でスクショ + DOM取得（ボット対策回避対応）' },
  { value: 'proxy', label: 'カスタムプロキシ', description: '自前のプロキシサーバーを使用' },
];

export function SettingsPanel() {
  const config = useScreenshotStore((s) => s.config);
  const showSettings = useScreenshotStore((s) => s.showSettings);
  const setConfig = useScreenshotStore((s) => s.setConfig);
  const setShowSettings = useScreenshotStore((s) => s.setShowSettings);

  if (!showSettings) return null;

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
          width: 520,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            スクリーンショット取得設定
          </h2>
          <button
            onClick={() => setShowSettings(false)}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}
          >
            ×
          </button>
        </div>

        {/* Fetch Method */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>
            取得方法
          </label>
          {METHODS.map((m) => (
            <label
              key={m.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                marginBottom: 4,
                borderRadius: 8,
                cursor: 'pointer',
                background: config.method === m.value ? '#f0f7ff' : '#fafafa',
                border: `1px solid ${config.method === m.value ? '#4A90D9' : '#eee'}`,
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="method"
                value={m.value}
                checked={config.method === m.value}
                onChange={() => setConfig({ method: m.value })}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{m.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* API Key */}
        {config.method !== 'none' && config.method !== 'proxy' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              APIキー
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              placeholder="APIキーを入力..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              {config.method === 'screenshotone'
                ? 'screenshotone.com でAPIキーを取得してください'
                : 'app.scrapingbee.com でAPIキーを取得してください'
              }
            </div>
          </div>
        )}

        {/* Proxy URL */}
        {config.method === 'proxy' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              プロキシURL
            </label>
            <input
              type="url"
              value={config.proxyUrl || ''}
              onChange={(e) => setConfig({ proxyUrl: e.target.value })}
              placeholder="https://your-proxy.workers.dev"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Rate Limit */}
        {config.method !== 'none' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              リクエスト間隔: {config.rateLimit / 1000}秒
            </label>
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={config.rateLimit}
              onChange={(e) => setConfig({ rateLimit: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
              <span>1秒</span>
              <span>10秒</span>
            </div>
          </div>
        )}

        {/* robots.txt */}
        {config.method !== 'none' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.respectRobotsTxt}
                onChange={(e) => setConfig({ respectRobotsTxt: e.target.checked })}
              />
              <span style={{ fontSize: 13 }}>robots.txt を遵守する</span>
            </label>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4, marginLeft: 24 }}>
              クロールが禁止されているページはスキップします
            </div>
          </div>
        )}

        {/* Bot Protection Notice */}
        {config.method === 'scrapingbee' && (
          <div style={{
            padding: '12px 16px',
            background: '#f0f7ff',
            borderRadius: 8,
            border: '1px solid #cce0ff',
            fontSize: 12,
            color: '#555',
            marginBottom: 16,
          }}>
            <strong>ボット対策回避について</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>ScrapingBee はレジデンシャルプロキシを使用し、多くのボット対策を自動回避します</li>
              <li>Cloudflare, Akamai等の対策にも対応（premium_proxy使用）</li>
              <li>取得失敗時はエクスポネンシャルバックオフで自動リトライします</li>
              <li>リトライ回数: {config.maxRetries}回</li>
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
