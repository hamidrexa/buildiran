/**
 * BuildIran — useOfflineTiles hook (Native only)
 *
 * Subscribes to OfflineTileManager and returns reactive state.
 * Safe to call from any component; subscribes once and auto-cleans up.
 *
 * On Web, always returns { status: 'ready', progress: 100, error: null }
 * so the calling component doesn't need platform guards.
 */

import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import type { OfflineTileState } from '@/lib/offlineTileManager';

const WEB_STATE: OfflineTileState = {
  status: 'ready',
  progress: 100,
  error: null,
};

export function useOfflineTiles(): OfflineTileState {
  const [state, setState] = useState<OfflineTileState>(WEB_STATE);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Lazy-import to avoid pulling native MapLibre into the web bundle.
    const { offlineTileManager } = require('@/lib/offlineTileManager') as typeof import('@/lib/offlineTileManager');
    return offlineTileManager.subscribe(setState);
  }, []);

  return state;
}
