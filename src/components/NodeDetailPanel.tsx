import { useSitemapStore } from '../store/sitemap-store';
import { useScreenshotStore } from '../store/screenshot-store';
import type { SitemapNodeData, PatternGroup, PageSnapshot, VisualPatternGroup } from '../types';

const PAGE_TYPE_LABELS: Record<string, string> = {
  listing: '一覧ページ',
  detail: '詳細ページ',
  static: '固定ページ',
  pagination: 'ページネーション',
  unknown: '不明',
};

const SECTION_HEADER = {
  fontSize: 11 as const,
  color: '#888',
  fontWeight: 600 as const,
  marginBottom: 4,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
};

function ScreenshotSection({ snapshot }: { snapshot: PageSnapshot }) {
  const retrySnapshot = useScreenshotStore((s) => s.retrySnapshot);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...SECTION_HEADER, marginBottom: 8 }}>スクリーンショット</div>

      {snapshot.status === 'success' && snapshot.screenshotUrl && (
        <img
          src={snapshot.screenshotUrl}
          alt="Page screenshot"
          style={{
            width: '100%',
            borderRadius: 6,
            border: '1px solid #eee',
            cursor: 'pointer',
          }}
          onClick={() => window.open(snapshot.screenshotUrl, '_blank')}
        />
      )}

      {snapshot.status === 'fetching' && (
        <div style={{ padding: 20, textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: 6 }}>
          取得中...
        </div>
      )}

      {snapshot.status === 'error' && (
        <div style={{ padding: 12, background: '#fef2f2', borderRadius: 6, fontSize: 12 }}>
          <div style={{ color: '#DE3618', marginBottom: 8 }}>{snapshot.error}</div>
          <button
            onClick={() => retrySnapshot(snapshot.url)}
            style={{
              padding: '4px 12px', borderRadius: 4, border: '1px solid #ddd',
              background: '#fff', cursor: 'pointer', fontSize: 11,
            }}
          >
            リトライ
          </button>
        </div>
      )}

      {snapshot.status === 'blocked' && (
        <div style={{ padding: 12, background: '#fff8e1', borderRadius: 6, fontSize: 12, color: '#856404' }}>
          {snapshot.error}
        </div>
      )}

      {snapshot.status === 'pending' && (
        <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 12, color: '#888', textAlign: 'center' }}>
          まだ取得されていません
        </div>
      )}
    </div>
  );
}

function MetadataSection({ snapshot }: { snapshot: PageSnapshot }) {
  if (!snapshot.metadata) return null;
  const m = snapshot.metadata;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...SECTION_HEADER, marginBottom: 8 }}>ページ情報</div>
      <div style={{ fontSize: 12, lineHeight: 1.8 }}>
        {m.title && (
          <div><span style={{ color: '#888', marginRight: 8 }}>title:</span>{m.title}</div>
        )}
        {m.h1 && (
          <div><span style={{ color: '#888', marginRight: 8 }}>h1:</span>{m.h1}</div>
        )}
        {m.description && (
          <div><span style={{ color: '#888', marginRight: 8 }}>description:</span>
            <span style={{ color: '#555' }}>{m.description.slice(0, 120)}{m.description.length > 120 ? '...' : ''}</span>
          </div>
        )}
        {m.ogTitle && m.ogTitle !== m.title && (
          <div><span style={{ color: '#888', marginRight: 8 }}>og:title:</span>{m.ogTitle}</div>
        )}
        {m.ogImage && (
          <div style={{ marginTop: 8 }}>
            <span style={{ color: '#888', display: 'block', marginBottom: 4 }}>og:image:</span>
            <img src={m.ogImage} alt="OG" style={{ maxWidth: '100%', borderRadius: 4, border: '1px solid #eee' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function DomStructureSection({ snapshot }: { snapshot: PageSnapshot }) {
  if (!snapshot.domStructure) return null;

  type DomNode = { tag: string; children: DomNode[]; id?: string; classNames?: string[] };

  function renderDom(node: DomNode, depth: number): React.ReactNode {
    if (depth > 4) return null;
    const indent = depth * 16;
    return (
      <div key={`${node.tag}-${depth}-${node.id || ''}`}>
        <div style={{ paddingLeft: indent, fontSize: 11, fontFamily: 'monospace', lineHeight: 1.8 }}>
          <span style={{ color: '#0550ae' }}>&lt;{node.tag}</span>
          {node.id && <span style={{ color: '#953800' }}> #{node.id}</span>}
          {node.classNames?.slice(0, 2).map((c) => (
            <span key={c} style={{ color: '#6e7781' }}>.{c}</span>
          ))}
          <span style={{ color: '#0550ae' }}>&gt;</span>
        </div>
        {node.children.map((child, idx) => <span key={idx}>{renderDom(child, depth + 1)}</span>)}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...SECTION_HEADER, marginBottom: 8 }}>DOM構造</div>
      <div style={{
        background: '#f6f8fa', borderRadius: 6, padding: '8px 12px',
        maxHeight: 200, overflow: 'auto', border: '1px solid #eee',
      }}>
        {renderDom(snapshot.domStructure as Parameters<typeof renderDom>[0], 0)}
      </div>
      {snapshot.domFingerprint && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
          fingerprint: {snapshot.domFingerprint}
        </div>
      )}
    </div>
  );
}

function VisualPatternSection({ url, groups }: { url: string; groups: VisualPatternGroup[] }) {
  const matchingGroup = groups.find((g) => g.urls.includes(url));
  if (!matchingGroup) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...SECTION_HEADER, marginBottom: 8 }}>ビジュアルパターン</div>
      <div style={{
        padding: '8px 12px',
        background: matchingGroup.color + '10',
        borderLeft: `3px solid ${matchingGroup.color}`,
        borderRadius: 4,
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{matchingGroup.label}</div>
        <div style={{ fontSize: 12, color: '#555' }}>{matchingGroup.explanation}</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
          {matchingGroup.urls.length}件のページがこのパターンに一致
        </div>
      </div>
    </div>
  );
}

export function NodeDetailPanel() {
  const selectedNodeId = useSitemapStore((s) => s.selectedNodeId);
  const nodes = useSitemapStore((s) => s.nodes);
  const selectNode = useSitemapStore((s) => s.selectNode);
  const getSnapshot = useScreenshotStore((s) => s.getSnapshot);
  const fetchSnapshot = useScreenshotStore((s) => s.fetchSnapshot);
  const config = useScreenshotStore((s) => s.config);
  const visualPatternGroups = useScreenshotStore((s) => s.visualPatternGroups);

  if (!selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const data = node.data as SitemapNodeData;
  const pattern = data.patternGroup as PatternGroup | undefined;

  // Try to find a snapshot for this node's URL
  const fullUrl = data.fullPath !== '/' ? `https://${selectedNodeId.split('/')[0]}${data.fullPath}` : undefined;
  const snapshot = fullUrl ? getSnapshot(fullUrl) : undefined;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 380,
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
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 1,
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{data.label}</h3>
        <button
          onClick={() => selectNode(null)}
          style={{
            background: 'none', border: 'none', fontSize: 20,
            cursor: 'pointer', color: '#999', padding: '4px 8px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Screenshot */}
        {snapshot && <ScreenshotSection snapshot={snapshot} />}

        {/* Fetch screenshot button */}
        {!snapshot && fullUrl && config.method !== 'none' && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => fetchSnapshot(fullUrl)}
              style={{
                width: '100%', padding: '8px 16px', borderRadius: 6,
                border: '1px solid #4A90D9', background: '#f0f7ff',
                color: '#4A90D9', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              スクリーンショットを取得
            </button>
          </div>
        )}

        {/* Metadata */}
        {snapshot && <MetadataSection snapshot={snapshot} />}

        {/* DOM Structure */}
        {snapshot && <DomStructureSection snapshot={snapshot} />}

        {/* Visual Pattern */}
        {fullUrl && visualPatternGroups.length > 0 && (
          <VisualPatternSection url={fullUrl} groups={visualPatternGroups} />
        )}

        {/* Path */}
        <div style={{ marginBottom: 16 }}>
          <div style={SECTION_HEADER}>パス</div>
          <code style={{ fontSize: 13, background: '#f5f5f5', padding: '4px 8px', borderRadius: 4, display: 'block', wordBreak: 'break-all' }}>
            {data.fullPath}
          </code>
        </div>

        {/* Page Type */}
        <div style={{ marginBottom: 16 }}>
          <div style={SECTION_HEADER}>ページタイプ</div>
          <span style={{
            display: 'inline-block', padding: '4px 10px', borderRadius: 12,
            fontSize: 12, fontWeight: 600,
            background: pattern?.color ? pattern.color + '20' : '#f0f0f0',
            color: pattern?.color ?? '#666',
          }}>
            {PAGE_TYPE_LABELS[data.pageType]}
          </span>
        </div>

        {/* URL Count */}
        {data.urlCount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={SECTION_HEADER}>配下のURL数</div>
            <span style={{ fontSize: 13 }}>{data.urlCount} ページ</span>
          </div>
        )}

        {/* Pattern Group Info */}
        {pattern && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={SECTION_HEADER}>URLパターン</div>
              <div style={{
                padding: '8px 12px',
                background: pattern.color + '10',
                borderLeft: `3px solid ${pattern.color}`,
                borderRadius: 4, fontSize: 13,
              }}>
                <code>{pattern.displayPattern}</code>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={SECTION_HEADER}>パターンの説明</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#444', margin: 0 }}>
                {pattern.explanation.summary}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={SECTION_HEADER}>判定理由</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#444', margin: 0 }}>
                {pattern.explanation.pageTypeReason}
              </p>
            </div>

            {/* Segment Analysis */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...SECTION_HEADER, marginBottom: 8 }}>セグメント分析</div>
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
                          padding: '2px 6px', borderRadius: 4, fontSize: 11,
                          background: seg.type === 'dynamic' ? '#fff3cd' : '#e8f5e9',
                          color: seg.type === 'dynamic' ? '#856404' : '#2e7d32',
                        }}>
                          {seg.type === 'static' ? '固定' : seg.dynamicType}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 11 }}>
                        {seg.type === 'static' ? seg.staticValue : seg.sampleValues?.slice(0, 3).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sample URLs */}
            <div>
              <div style={{ ...SECTION_HEADER, marginBottom: 8 }}>
                サンプルURL ({pattern.urls.length}件中)
              </div>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {pattern.urls.slice(0, 10).map((url, i) => (
                  <div key={i} style={{
                    fontSize: 11, fontFamily: 'monospace', padding: '4px 8px',
                    background: i % 2 === 0 ? '#fafafa' : '#fff',
                    borderRadius: 4, wordBreak: 'break-all', color: '#555',
                  }}>
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
