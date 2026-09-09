/**
 * BuildIran — useViewportTracker
 * Passively records which other-players' assets are visible in the map viewport.
 * Batches and flushes to Supabase every VIEWPORT_VIEW_FLUSH_INTERVAL_MS ms.
 * Deduplicates within a session so each asset is only sent once per flush cycle.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useAssetStore } from '@/store/useAssetStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { VIEWPORT_VIEW_FLUSH_INTERVAL_MS } from '@/lib/constants';
import type { Asset } from '@/types/game.types';

interface ViewBatch {
  assetId: string;
  viewerId: string;
  ownerId: string;
}

/**
 * Call this hook in the map screen.
 * Pass `visibleAssets` — the list of Asset objects currently rendered in the viewport.
 * The hook takes care of deduplication, batching and flushing.
 */
export function useViewportTracker(visibleAssets: Asset[]) {
  const player = usePlayerStore((s) => s.player);
  const recordViewportViews = useEconomyStore((s) => s.recordViewportViews);

  // Session-level set of "asset_id:date" already sent — avoids resending
  // views that the server will deduplicate anyway, saving RPC calls.
  const sentToday = useRef<Set<string>>(new Set());

  // Pending batch waiting for the next flush
  const pending = useRef<ViewBatch[]>([]);

  const flush = useCallback(async () => {
    if (!pending.current.length) return;
    const batch = [...pending.current];
    pending.current = [];
    await recordViewportViews(batch);
  }, [recordViewportViews]);

  // Accumulate views from the current visible set
  useEffect(() => {
    if (!player) return;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    for (const asset of visibleAssets) {
      // Skip own assets
      if (asset.ownerId === player.id) continue;

      const key = `${asset.id}:${today}`;
      if (sentToday.current.has(key)) continue;

      sentToday.current.add(key);
      pending.current.push({
        assetId: asset.id,
        viewerId: player.id,
        ownerId: asset.ownerId,
      });
    }
  }, [visibleAssets, player]);

  // Flush on interval
  useEffect(() => {
    const timer = setInterval(flush, VIEWPORT_VIEW_FLUSH_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      // Final flush on unmount
      flush();
    };
  }, [flush]);

  // Reset sentToday at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

    const timer = setTimeout(() => {
      sentToday.current.clear();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, []);
}
