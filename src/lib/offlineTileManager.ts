/**
 * BuildIran — OfflineTileManager (Web / Universal Fallback)
 *
 * On Web, offline tile caching is handled by browser cache / service worker
 * rather than native SQLite MapLibre packs.
 * This module provides an implementation conforming to OfflineTileManager
 * interface so components and screens can safely import and call it on Web / SSR.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OfflineTileStatus =
  | 'idle'        // Manager not yet initialised
  | 'checking'    // Querying existing packs
  | 'ready'       // Pack exists and is complete
  | 'downloading' // Active download in progress
  | 'error';      // Something went wrong

export interface OfflineTileState {
  status: OfflineTileStatus;
  /** 0–100, only meaningful when status === 'downloading' */
  progress: number;
  error: string | null;
}

type Listener = (state: OfflineTileState) => void;

// ─── Web Singleton ─────────────────────────────────────────────────────────────

class OfflineTileManagerWebClass {
  private state: OfflineTileState = {
    status: 'ready',
    progress: 100,
    error: null,
  };
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): OfflineTileState {
    return this.state;
  }

  async checkExistingPack(): Promise<boolean> {
    return true;
  }

  async bootstrap(_styleUrl: string): Promise<void> {
    // No-op on web: map tiles are fetched and cached via HTTP / browser cache
    return Promise.resolve();
  }

  async forceRefresh(_styleUrl: string): Promise<void> {
    return Promise.resolve();
  }
}

export const offlineTileManager = new OfflineTileManagerWebClass();
