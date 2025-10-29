import { create } from 'zustand';

export type AssetType = 'video' | 'image' | 'audio' | '3d';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  thumbnail?: string;
  duration?: number;
}

export interface TimelineClip {
  id: string;
  assetId: string;
  trackId: string;
  startTime: number;
  duration: number;
  properties: {
    position?: { x: number; y: number; z?: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z?: number };
    opacity?: number;
    volume?: number;
  };
}

export interface Track {
  id: string;
  name: string;
  type: AssetType;
  clips: TimelineClip[];
  muted?: boolean;
  locked?: boolean;
}

interface EditorState {
  assets: Asset[];
  tracks: Track[];
  selectedClipId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoom: number;
  
  // Actions
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  addClipToTrack: (trackId: string, clip: TimelineClip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  selectClip: (clipId: string | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setZoom: (zoom: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  assets: [],
  tracks: [
    { id: 'track-1', name: 'Video Track 1', type: 'video', clips: [] },
    { id: 'track-2', name: 'Image Track 1', type: 'image', clips: [] },
    { id: 'track-3', name: '3D Track 1', type: '3d', clips: [] },
    { id: 'track-4', name: 'Audio Track 1', type: 'audio', clips: [] },
  ],
  selectedClipId: null,
  currentTime: 0,
  duration: 60,
  isPlaying: false,
  zoom: 1,

  addAsset: (asset) => set((state) => ({
    assets: [...state.assets, asset],
  })),

  removeAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id),
  })),

  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track],
  })),

  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter((t) => t.id !== id),
  })),

  addClipToTrack: (trackId, clip) => set((state) => ({
    tracks: state.tracks.map((track) =>
      track.id === trackId
        ? { ...track, clips: [...track.clips, clip] }
        : track
    ),
  })),

  removeClip: (clipId) => set((state) => ({
    tracks: state.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((c) => c.id !== clipId),
    })),
    selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
  })),

  updateClip: (clipId, updates) => set((state) => ({
    tracks: state.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) =>
        clip.id === clipId ? { ...clip, ...updates } : clip
      ),
    })),
  })),

  selectClip: (clipId) => set({ selectedClipId: clipId }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setZoom: (zoom) => set({ zoom }),
}));
