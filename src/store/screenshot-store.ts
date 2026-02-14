import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScreenshotConfig, PageSnapshot, VisualPatternGroup } from '../types';
import { fetchPageSnapshot, fetchBatchSnapshots } from '../utils/screenshot-service';
import { classifyVisualPatterns } from '../utils/visual-pattern-detector';

interface ScreenshotState {
  // Config (persisted to localStorage)
  config: ScreenshotConfig;
  showSettings: boolean;

  // Snapshots
  snapshots: Map<string, PageSnapshot>;
  visualPatternGroups: VisualPatternGroup[];

  // Progress
  isFetching: boolean;
  fetchProgress: { completed: number; total: number; stage: string };
  isClassifying: boolean;
  classifyProgress: string;

  // Actions
  setConfig: (config: Partial<ScreenshotConfig>) => void;
  setShowSettings: (show: boolean) => void;
  fetchSnapshot: (url: string) => Promise<PageSnapshot>;
  fetchAllSnapshots: (urls: string[]) => Promise<void>;
  retrySnapshot: (url: string) => Promise<void>;
  classifyPatterns: () => Promise<void>;
  getSnapshot: (url: string) => PageSnapshot | undefined;
  clearSnapshots: () => void;
}

const DEFAULT_CONFIG: ScreenshotConfig = {
  method: 'none',
  apiKey: '',
  rateLimit: 2000,
  respectRobotsTxt: true,
  maxRetries: 2,
  timeout: 30000,
};

export const useScreenshotStore = create<ScreenshotState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      showSettings: false,
      snapshots: new Map(),
      visualPatternGroups: [],
      isFetching: false,
      fetchProgress: { completed: 0, total: 0, stage: '' },
      isClassifying: false,
      classifyProgress: '',

      setConfig: (partial) => {
        set((state) => ({ config: { ...state.config, ...partial } }));
      },

      setShowSettings: (show) => set({ showSettings: show }),

      fetchSnapshot: async (url) => {
        const { config, snapshots } = get();
        set({
          snapshots: new Map(snapshots).set(url, { url, status: 'fetching' }),
        });

        const snapshot = await fetchPageSnapshot(url, config);
        const newSnapshots = new Map(get().snapshots);
        newSnapshots.set(url, snapshot);
        set({ snapshots: newSnapshots });
        return snapshot;
      },

      fetchAllSnapshots: async (urls) => {
        const { config } = get();
        if (config.method === 'none') return;

        set({
          isFetching: true,
          fetchProgress: { completed: 0, total: urls.length, stage: 'スクリーンショットを取得中...' },
        });

        const results = await fetchBatchSnapshots(urls, config, (completed, total, snapshot) => {
          const newSnapshots = new Map(get().snapshots);
          newSnapshots.set(snapshot.url, snapshot);
          set({
            snapshots: newSnapshots,
            fetchProgress: {
              completed,
              total,
              stage: `${completed}/${total} 取得完了`,
            },
          });
        });

        const newSnapshots = new Map(get().snapshots);
        for (const [url, snap] of results) {
          newSnapshots.set(url, snap);
        }

        set({
          snapshots: newSnapshots,
          isFetching: false,
          fetchProgress: { completed: urls.length, total: urls.length, stage: '取得完了' },
        });
      },

      retrySnapshot: async (url) => {
        const { config, snapshots } = get();
        const newSnapshots = new Map(snapshots);
        newSnapshots.set(url, { url, status: 'fetching' });
        set({ snapshots: newSnapshots });

        const snapshot = await fetchPageSnapshot(url, config);
        const updatedSnapshots = new Map(get().snapshots);
        updatedSnapshots.set(url, snapshot);
        set({ snapshots: updatedSnapshots });
      },

      classifyPatterns: async () => {
        const { snapshots } = get();
        const snapshotArray = Array.from(snapshots.values());

        set({ isClassifying: true, classifyProgress: '分類を開始中...' });

        const result = await classifyVisualPatterns(snapshotArray, (stage) => {
          set({ classifyProgress: stage });
        });

        set({
          visualPatternGroups: result.groups,
          isClassifying: false,
          classifyProgress: '分類完了',
        });
      },

      getSnapshot: (url) => get().snapshots.get(url),

      clearSnapshots: () => set({
        snapshots: new Map(),
        visualPatternGroups: [],
        fetchProgress: { completed: 0, total: 0, stage: '' },
      }),
    }),
    {
      name: 'sitemap-screenshot-config',
      partialize: (state) => ({ config: state.config }),
    },
  ),
);
