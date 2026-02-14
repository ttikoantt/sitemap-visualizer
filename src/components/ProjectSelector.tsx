import { useEffect, useState } from 'react';
import { useSitemapStore } from '../store/sitemap-store';
import type { ProjectEntry } from '../utils/project-loader';

export function ProjectSelector() {
  const availableProjects = useSitemapStore((s) => s.availableProjects);
  const currentProject = useSitemapStore((s) => s.currentProject);
  const loadProjects = useSitemapStore((s) => s.loadProjects);
  const loadProject = useSitemapStore((s) => s.loadProject);
  const isLoading = useSitemapStore((s) => s.isLoading);

  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (availableProjects.length === 0) {
      loadProjects();
    }
  }, [availableProjects.length, loadProjects]);

  const handleLoad = () => {
    if (selected) {
      loadProject(selected);
    }
  };

  if (availableProjects.length === 0) return null;

  return (
    <div style={{ width: '100%', maxWidth: 500, marginBottom: 20 }}>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#555',
        marginBottom: 8,
      }}>
        登録済みの案件から選択
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #ddd',
            fontSize: 14,
            background: '#fff',
          }}
        >
          <option value="">案件を選択...</option>
          {availableProjects.map((p: ProjectEntry) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.description ? ` — ${p.description}` : ''}
            </option>
          ))}
        </select>
        <button
          onClick={handleLoad}
          disabled={!selected || isLoading || currentProject?.id === selected}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: '1px solid #4A90D9',
            background: selected ? '#4A90D9' : '#e0e0e0',
            color: selected ? '#fff' : '#999',
            cursor: selected && !isLoading ? 'pointer' : 'default',
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          読み込み
        </button>
      </div>
    </div>
  );
}
