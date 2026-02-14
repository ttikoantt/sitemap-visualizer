import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { ParsedURL, URLTreeNode, PatternGroup } from '../types';
import { parseURLList } from '../utils/url-parser';
import { buildURLTree } from '../utils/tree-builder';
import { detectPatterns } from '../utils/pattern-detector';
import { computeLayout } from '../utils/layout-engine';

interface SitemapState {
  // Data
  rawURLs: string[];
  parsedURLs: ParsedURL[];
  urlTree: URLTreeNode | null;
  patternGroups: PatternGroup[];
  nodes: Node[];
  edges: Edge[];

  // UI
  selectedNodeId: string | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  layoutDirection: 'DOWN' | 'RIGHT';
  fileName: string | null;

  // Actions
  processURLs: (urls: string[], fileName?: string) => Promise<void>;
  selectNode: (id: string | null) => void;
  setLayoutDirection: (dir: 'DOWN' | 'RIGHT') => void;
  reset: () => void;
}

const initialState = {
  rawURLs: [],
  parsedURLs: [],
  urlTree: null,
  patternGroups: [],
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,
  loadingMessage: '',
  error: null,
  layoutDirection: 'DOWN' as const,
  fileName: null,
};

export const useSitemapStore = create<SitemapState>((set, get) => ({
  ...initialState,

  processURLs: async (urls, fileName) => {
    set({ isLoading: true, loadingMessage: 'URLを解析中...', error: null, rawURLs: urls, fileName: fileName ?? null });

    try {
      const parsed = parseURLList(urls);
      if (parsed.length === 0) {
        set({ ...initialState, error: '有効なURLが見つかりませんでした', fileName: fileName ?? null });
        return;
      }

      set({ parsedURLs: parsed, loadingMessage: 'ツリーを構築中...' });

      const tree = buildURLTree(parsed);
      set({ urlTree: tree, loadingMessage: 'パターンを検出中...' });

      const patterns = detectPatterns(tree);
      set({ patternGroups: patterns, loadingMessage: 'レイアウトを計算中...' });

      const direction = get().layoutDirection;
      const { nodes, edges } = await computeLayout(tree, patterns, direction);

      set({
        nodes,
        edges,
        isLoading: false,
        loadingMessage: '',
      });
    } catch (e) {
      set({
        isLoading: false,
        loadingMessage: '',
        error: (e as Error).message,
      });
    }
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  setLayoutDirection: async (dir) => {
    const { urlTree, patternGroups } = get();
    if (!urlTree) {
      set({ layoutDirection: dir });
      return;
    }

    set({ layoutDirection: dir, isLoading: true, loadingMessage: 'レイアウトを再計算中...' });

    try {
      const { nodes, edges } = await computeLayout(urlTree, patternGroups, dir);
      set({ nodes, edges, isLoading: false, loadingMessage: '' });
    } catch (e) {
      set({ isLoading: false, loadingMessage: '', error: (e as Error).message });
    }
  },

  reset: () => set(initialState),
}));
