/**
 * BuildIran — useActivityTracker
 * Simple hook that awards activity points for trackable user actions.
 * Calls usePlayerStore.incrementActivity() which optimistically updates
 * local state and persists to Supabase.
 *
 * Usage:
 *   const { track } = useActivityTracker();
 *   track('build_complete');   // +8 activity
 *   track('marketplace_view'); // +2 activity
 */

import { useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { ACTIVITY_EVENTS, type ActivityEventKey } from '@/lib/constants';

export function useActivityTracker() {
  const incrementActivity = usePlayerStore((s) => s.incrementActivity);

  const track = useCallback(
    async (event: ActivityEventKey) => {
      const points = ACTIVITY_EVENTS[event];
      if (!points) return;
      await incrementActivity(points);
    },
    [incrementActivity],
  );

  return { track };
}
