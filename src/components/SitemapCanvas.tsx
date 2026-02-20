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
import type { PatternGroup, SitemapNodeData } from '../types';

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
    style: { stroke: '#c0c8d0', strokeWidth: 1.5 },
    pathOptions: { borderRadius: 20 },
  }), []);

  const minimapNodeColor = useCallback((node: { data: Record<string, unknown> }) => {
    const data = node.data as SitemapNodeData;
    const pattern = data?.patternGroup as PatternGroup | undefined;
    return pattern?.color ?? '#ccc';
  }, []);

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
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          maskColor="rgba(0,0,0,0.06)"
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={0}
          nodeBorderRadius={4}
        />
        <Controls
          style={{
            borderRadius: 10,
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
          showInteractive={false}
        />
        <Background variant={BackgroundVariant.Cross} gap={24} size={1} color="#e8e8e8" />
      </ReactFlow>
    </div>
  );
}
