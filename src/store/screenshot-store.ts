import { create } from 'zustand';
import type { PageSnapshot, VisualPatternGroup, DomStructure } from '../types';
import { fetchScreenshotManifest } from '../utils/project-loader';
import { classifyVisualPatterns } from '../utils/visual-pattern-detector';

interface ScreenshotState {
  // Snapshots
  snapshots: Map<string, PageSnapshot>;
  visualPatternGroups: VisualPatternGroup[];
  manifestLoaded: boolean;
  manifestGeneratedAt: string | null;

  // UI
  showSettings: boolean;

  // Progress
  isFetching: boolean;
  fetchProgress: { completed: number; total: number; stage: string };
  isClassifying: boolean;
  classifyProgress: string;

  // Actions
  setShowSettings: (show: boolean) => void;
  loadManifest: (projectId: string) => Promise<void>;
  classifyPatterns: () => Promise<void>;
  getSnapshot: (url: string) => PageSnapshot | undefined;
  clearSnapshots: () => void;
}

export const useScreenshotStore = create<ScreenshotState>()((set, get) => ({
  snapshots: new Map(),
  visualPatternGroups: [],
  manifestLoaded: false,
  manifestGeneratedAt: null,
  showSettings: false,
  isFetching: false,
  fetchProgress: { completed: 0, total: 0, stage: '' },
  isClassifying: false,
  classifyProgress: '',

  setShowSettings: (show) => set({ showSettings: show }),

  loadManifest: async (projectId) => {
    set({
      isFetching: true,
      fetchProgress: { completed: 0, total: 0, stage: 'マニフェストを読み込み中...' },
    });

    const manifest = await fetchScreenshotManifest(projectId);

    if (!manifest) {
      set({
        isFetching: false,
        manifestLoaded: false,
        fetchProgress: { completed: 0, total: 0, stage: '' },
      });
      return;
    }

    const snapshotsMap = new Map<string, PageSnapshot>();
    const entries = Object.entries(manifest.snapshots);

    for (const [url, data] of entries) {
      snapshotsMap.set(url, {
        url,
        screenshotUrl: `${import.meta.env.BASE_URL}data/${projectId}/${data.screenshotPath}`,
        metadata: data.metadata,
        domStructure: data.domStructure as DomStructure | undefined,
        domFingerprint: data.domFingerprint,
        fetchedAt: new Date(manifest.generatedAt).getTime(),
        status: 'success',
      });
    }

    set({
      snapshots: snapshotsMap,
      manifestLoaded: true,
      manifestGeneratedAt: manifest.generatedAt,
      isFetching: false,
      fetchProgress: { completed: entries.length, total: entries.length, stage: `${entries.length}件 読み込み完了` },
    });
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
    manifestLoaded: false,
    manifestGeneratedAt: null,
    fetchProgress: { completed: 0, total: 0, stage: '' },
  }),
}));
