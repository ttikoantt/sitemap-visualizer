import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { ParsedURL, URLTreeNode, PatternGroup } from '../types';
import { parseURLList } from '../utils/url-parser';
import { buildURLTree } from '../utils/tree-builder';
import { detectPatterns } from '../utils/pattern-detector';
import { computeLayout } from '../utils/layout-engine';
import { fetchProjectList, fetchProjectCSV, type ProjectEntry } from '../utils/project-loader';

interface SitemapState {
  // Data
  rawURLs: string[];
  parsedURLs: ParsedURL[];
  urlTree: URLTreeNode | null;
  patternGroups: PatternGroup[];
  nodes: Node[];
  edges: Edge[];

  // Project
  currentProject: { id: string; name: string } | null;
  availableProjects: ProjectEntry[];

  // UI
  selectedNodeId: string | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  layoutDirection: 'DOWN' | 'RIGHT';
  fileName: string | null;

  // Actions
  processURLs: (urls: string[], fileName?: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
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
  currentProject: null,
  availableProjects: [] as ProjectEntry[],
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
        set({ ...initialState, availableProjects: get().availableProjects, error: '有効なURLが見つかりませんでした', fileName: fileName ?? null });
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

  loadProjects: async () => {
    try {
      const projects = await fetchProjectList();
      set({ availableProjects: projects });
    } catch {
      // index.json not found — no projects configured
    }
  },

  loadProject: async (projectId) => {
    const project = get().availableProjects.find((p) => p.id === projectId);
    if (!project) return;

    set({ isLoading: true, loadingMessage: `${project.name} を読み込み中...`, error: null, currentProject: { id: project.id, name: project.name } });

    try {
      const urls = await fetchProjectCSV(projectId);
      await get().processURLs(urls, `${project.name}`);
    } catch (e) {
      set({ isLoading: false, loadingMessage: '', error: (e as Error).message });
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

  reset: () => set({ ...initialState, availableProjects: get().availableProjects }),
}));
