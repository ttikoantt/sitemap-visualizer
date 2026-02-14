import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo } from 'react';
import { URLNode } from './URLNode';
import { useSitemapStore } from '../store/sitemap-store';

const nodeTypes = { urlNode: URLNode };

export function SitemapCanvas() {
  const nodes = useSitemapStore((s) => s.nodes);
  const edges = useSitemapStore((s) => s.edges);
  const selectNode = useSitemapStore((s) => s.selectNode);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    style: { stroke: '#b0b0b0', strokeWidth: 1.5 },
  }), []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes as never[]}
        edges={edges}
        nodeTypes={nodeTypes as never}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          style={{ border: '1px solid #e0e0e0', borderRadius: 8 }}
          maskColor="rgba(0,0,0,0.08)"
        />
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ddd" />
      </ReactFlow>
    </div>
  );
}
