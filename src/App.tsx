import { useSitemapStore } from './store/sitemap-store';
import { EmptyState } from './components/EmptyState';
import { SitemapCanvas } from './components/SitemapCanvas';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { PatternLegend } from './components/PatternLegend';
import { ToolbarControls } from './components/ToolbarControls';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  const nodes = useSitemapStore((s) => s.nodes);
  const hasData = nodes.length > 0;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {hasData ? (
        <>
          <SitemapCanvas />
          <ToolbarControls />
          <PatternLegend />
          <NodeDetailPanel />
        </>
      ) : (
        <EmptyState />
      )}
      <SettingsPanel />
    </div>
  );
}

export default App;
