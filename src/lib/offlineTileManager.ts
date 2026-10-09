/**
 * BuildIran — OfflineTileManager (Native only)
 *
 * Manages a single MapLibre offline tile pack covering all of Tehran
 * (zoom 10–16). Uses the native OfflineManager backed by SQLite —
 * the fastest possible local tile source on iOS & Android.
 *
 * The pack is identified by a version tag stored in `metadata.packVersion`.
 * Bumping PACK_VERSION triggers automatic deletion of the old pack and
 * re-download of the new one on next app launch.
 *
 * Usage:
 *   import { offlineTileManager } from '@/lib/offlineTileManager';
 *   await offlineTileManager.bootstrap(styleUrl);
 */

import {
  OfflineManager,
  type OfflinePack,
  type OfflinePackStatus,
  type OfflinePackError,
} from '@maplibre/maplibre-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TEHRAN_BOUNDS } from './constants';

// ─── Pack Identity ─────────────────────────────────────────────────────────────

/**
 * Bump this string whenever the tile source or bounds change so devices
 * with old packs re-download automatically on next launch.
 */
const PACK_VERSION = 'v2';
const METADATA_KEY_VERSION = 'packVersion';
const METADATA_KEY_LABEL = 'label';
const STORAGE_KEY_PACK_ID = 'buildiran:offline_pack_id';

/** Zoom range: 10 (city overview) → 16 (street / building-placement level). */
const MIN_ZOOM = 10;
const MAX_ZOOM = 16;

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

// ─── Singleton ─────────────────────────────────────────────────────────────────

class OfflineTileManagerClass {
  private state: OfflineTileState = {
    status: 'idle',
    progress: 0,
    error: null,
  };
  private listeners = new Set<Listener>();
  private bootstrapped = false;

  constructor() {
    // ─── Offline map: cap ambient cache (background tile browsing) at 100 MB. ──────
    try {
      OfflineManager.setMaximumAmbientCacheSize(100 * 1024 * 1024);
    } catch {
      // Non-fatal; fails in Expo Go
    }
  }

  // ── Observer pattern ────────────────────────────────────────────────────────

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately deliver current state to new subscriber.
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit(patch: Partial<OfflineTileState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn(this.state));
  }

  getState(): OfflineTileState {
    return this.state;
  }

  /** Checks if an offline pack already exists and is complete without starting download. */
  async checkExistingPack(): Promise<boolean> {
    try {
      const savedId = await AsyncStorage.getItem(STORAGE_KEY_PACK_ID);
      if (!savedId) return false;
      const pack = await OfflineManager.getPack(savedId);
      const packStatus: OfflinePackStatus = await pack.status();
      if ((packStatus.percentage ?? 0) >= 100) {
        this.emit({ status: 'ready', progress: 100, error: null });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Call when offline mode is enabled to ensure the Tehran pack is present.
   * Safe to call multiple times.
   *
   * @param styleUrl  The MapLibre style URL whose tiles we want to cache.
   *                  Must be the same style the map renders.
   */
  async bootstrap(styleUrl: string): Promise<void> {
    if (this.state.status === 'downloading' || this.state.status === 'ready') {
      return;
    }

    this.emit({ status: 'checking', error: null });

    try {
      // Remove stale packs from previous app versions.
      await this.pruneOldPacks();

      // Check if an up-to-date pack already exists.
      const savedId = await AsyncStorage.getItem(STORAGE_KEY_PACK_ID);
      if (savedId) {
        try {
          const pack = await OfflineManager.getPack(savedId);
          const packStatus: OfflinePackStatus = await pack.status();
          if ((packStatus.percentage ?? 0) >= 100) {
            this.emit({ status: 'ready', progress: 100, error: null });
            return;
          }
          // Incomplete — fall through and re-create (createPack resumes internally).
        } catch {
          // Pack no longer in DB — re-create below.
          await AsyncStorage.removeItem(STORAGE_KEY_PACK_ID);
        }
      }

      await this.startDownload(styleUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[OfflineTileManager] bootstrap error:', msg);
      this.emit({ status: 'error', error: msg });
    }
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private async startDownload(styleUrl: string): Promise<void> {
    this.emit({ status: 'downloading', progress: 0, error: null });

    const sw = TEHRAN_BOUNDS.southWest;
    const ne = TEHRAN_BOUNDS.northEast;

    // LngLatBounds: [west, south, east, north]
    const bounds: [number, number, number, number] = [
      sw.longitude,
      sw.latitude,
      ne.longitude,
      ne.latitude,
    ];

    const progressListener = (pack: OfflinePack, status: OfflinePackStatus) => {
      const pct = Math.round(status.percentage ?? 0);
      if (pct >= 100) {
        // Persist the pack ID so future sessions skip re-download.
        AsyncStorage.setItem(STORAGE_KEY_PACK_ID, pack.id).catch(() => {});
        this.emit({ status: 'ready', progress: 100 });
      } else {
        this.emit({ status: 'downloading', progress: pct });
      }
    };

    const errorListener = (_pack: OfflinePack, error: OfflinePackError) => {
      const msg = error?.message ?? 'Unknown download error';
      console.warn('[OfflineTileManager] download error:', msg);
      this.emit({ status: 'error', error: msg });
    };

    const pack = await OfflineManager.createPack(
      {
        mapStyle: styleUrl,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        bounds,
        metadata: {
          [METADATA_KEY_LABEL]: 'Tehran Offline Map',
          [METADATA_KEY_VERSION]: PACK_VERSION,
        },
      },
      progressListener,
      errorListener,
    );

    // Persist ID immediately so we can look it up if the app restarts mid-download.
    await AsyncStorage.setItem(STORAGE_KEY_PACK_ID, pack.id).catch(() => {});
  }

  /** Delete packs whose metadata version is outdated. */
  private async pruneOldPacks(): Promise<void> {
    try {
      const packs = await OfflineManager.getPacks();
      for (const pack of packs) {
        const version = pack.metadata?.[METADATA_KEY_VERSION];
        if (version !== PACK_VERSION) {
          await OfflineManager.deletePack(pack.id);
        }
      }
    } catch {
      // Non-fatal — worst case old packs sit unused.
    }
  }

  /** Force a fresh download (e.g. from a Settings screen). */
  async forceRefresh(styleUrl: string): Promise<void> {
    this.bootstrapped = false;
    await AsyncStorage.removeItem(STORAGE_KEY_PACK_ID).catch(() => {});
    try {
      const packs = await OfflineManager.getPacks();
      for (const pack of packs) {
        await OfflineManager.deletePack(pack.id);
      }
    } catch {
      // Ignore — proceed to re-download.
    }
    await this.bootstrap(styleUrl);
  }
}

export const offlineTileManager = new OfflineTileManagerClass();
