import { useSitemapStore } from '../store/sitemap-store';
import type { SitemapNodeData } from '../types';

const PAGE_TYPE_LABELS: Record<string, string> = {
  listing: '一覧ページ',
  detail: '詳細ページ',
  static: '固定ページ',
  pagination: 'ページネーション',
  unknown: '不明',
};

export function NodeDetailPanel() {
  const selectedNodeId = useSitemapStore((s) => s.selectedNodeId);
  const nodes = useSitemapStore((s) => s.nodes);
  const selectNode = useSitemapStore((s) => s.selectNode);

  if (!selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const data = node.data as SitemapNodeData;
  const pattern = data.patternGroup;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 360,
      height: '100%',
      background: '#fff',
      borderLeft: '1px solid #e0e0e0',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
      overflow: 'auto',
      zIndex: 10,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{data.label}</h3>
        <button
          onClick={() => selectNode(null)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#999',
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Path */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            パス
          </div>
          <code style={{ fontSize: 13, background: '#f5f5f5', padding: '4px 8px', borderRadius: 4, display: 'block', wordBreak: 'break-all' }}>
            {data.fullPath}
          </code>
        </div>

        {/* Page Type */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            ページタイプ
          </div>
          <span style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: pattern?.color ? pattern.color + '20' : '#f0f0f0',
            color: pattern?.color ?? '#666',
          }}>
            {PAGE_TYPE_LABELS[data.pageType]}
          </span>
        </div>

        {/* URL Count */}
        {data.urlCount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              配下のURL数
            </div>
            <span style={{ fontSize: 13 }}>{data.urlCount} ページ</span>
          </div>
        )}

        {/* Pattern Group Info */}
        {pattern && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                パターン
              </div>
              <div style={{
                padding: '8px 12px',
                background: pattern.color + '10',
                borderLeft: `3px solid ${pattern.color}`,
                borderRadius: 4,
                fontSize: 13,
              }}>
                <code>{pattern.displayPattern}</code>
              </div>
            </div>

            {/* Explanation */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                パターンの説明
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#444', margin: 0 }}>
                {pattern.explanation.summary}
              </p>
            </div>

            {/* Page Type Reason */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                判定理由
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#444', margin: 0 }}>
                {pattern.explanation.pageTypeReason}
              </p>
            </div>

            {/* Segment Analysis */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                セグメント分析
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#666' }}>位置</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#666' }}>タイプ</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#666' }}>値</th>
                  </tr>
                </thead>
                <tbody>
                  {pattern.explanation.segments.map((seg, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '6px 8px' }}>/{seg.position}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: seg.type === 'dynamic' ? '#fff3cd' : '#e8f5e9',
                          color: seg.type === 'dynamic' ? '#856404' : '#2e7d32',
                        }}>
                          {seg.type === 'static' ? '固定' : seg.dynamicType}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 11 }}>
                        {seg.type === 'static'
                          ? seg.staticValue
                          : seg.sampleValues?.slice(0, 3).join(', ')
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sample URLs */}
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                サンプルURL ({pattern.urls.length}件中)
              </div>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {pattern.urls.slice(0, 10).map((url, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      background: i % 2 === 0 ? '#fafafa' : '#fff',
                      borderRadius: 4,
                      wordBreak: 'break-all',
                      color: '#555',
                    }}
                  >
                    {url.original}
                  </div>
                ))}
                {pattern.urls.length > 10 && (
                  <div style={{ fontSize: 11, color: '#999', padding: '4px 8px' }}>
                    ... 他 {pattern.urls.length - 10} 件
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
