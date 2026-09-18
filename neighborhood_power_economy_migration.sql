-- ============================================================
--  BuildIran — Neighborhood Power Economy Migration
--  Run AFTER:
--    1. "Supabase Schema.sql"
--    2. "economy_migration.sql"
--    3. "build_modes_v1_migration.sql"
--    4. "npc_workers_migration.sql"
--    5. "tehran_districts_migration.sql"
--    6. "tehran_districts_community_centers_migration.sql"
--    7. "ncc_council_migration.sql"
--
--  What this migration adds:
--    • Amenity scoring on neighborhoods (computed from assets, cached by trigger)
--    • Cost multiplier on neighborhoods (derived from amenity tier)
--    • Manual-claim neighborhood daily drip (player must open app to claim each day)
--    • RPC: claim_neighborhood_drip — awards power once per player per day based on
--      all neighborhoods where the player has at least one asset
--
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. New columns on neighborhoods ────────────────────────────────────────
-- amenity_score:          cached sum of weighted amenity contributions from all assets here
-- amenity_tier:           0–5, derived from amenity_score, recomputed by trigger
-- cost_multiplier:        build cost multiplier for this neighborhood (1.0–2.0)
-- neighborhood_daily_drip: power/day granted to players who own property here (via manual claim)

ALTER TABLE public.neighborhoods
  ADD COLUMN IF NOT EXISTS amenity_score            INTEGER        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amenity_tier             INTEGER        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_multiplier          NUMERIC(4, 2)  NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS neighborhood_daily_drip  INTEGER        NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.neighborhoods.amenity_score IS
  'Cached sum of amenity weights from all assets in this neighborhood. Updated by trigger.';
COMMENT ON COLUMN public.neighborhoods.amenity_tier IS
  '0–5 tier derived from amenity_score. 0=basic, 5=luxury.';
COMMENT ON COLUMN public.neighborhoods.cost_multiplier IS
  'Build cost multiplier for this neighborhood (1.00 = no premium, 2.00 = 2× cost).';
COMMENT ON COLUMN public.neighborhoods.neighborhood_daily_drip IS
  'Power granted per day to players who own at least one asset here and claim their bonus.';

-- ─── 2. New column on profiles ───────────────────────────────────────────────
-- last_neighborhood_drip_at: timestamp of the last manual neighborhood drip claim.
-- Used to enforce one claim per 20-hour cooldown (allows flexible daily play schedules).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_neighborhood_drip_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_neighborhood_drip_at IS
  'Last time the player manually claimed their neighborhood daily power drip.';

-- ─── 3. Amenity weight constants (embedded in SQL as a lookup CTE) ───────────
--
-- All building types → amenity weight (higher = more amenity contribution):
--
--  Residential (modest contribution — more supply = better community):
--    house: 1 | villa: 2 | tower: 4 | main_house: 2 | resident_house: 1
--
--  Commercial (moderate — services attract residents):
--    shop: 2 | cafe: 2 | gym: 3 | warehouse: 1 | exchange: 3
--    mall: 7 | restaurant: 2 | market: 2 | office: 3
--
--  Industrial (low — utility but creates noise/traffic):
--    farm: 1 | factory: 2
--
--  Public (high — directly defines neighborhood quality):
--    hospital: 8 | park: 5 | university: 10 | bank: 6
--
--  Military:
--    barracks: 1
--
-- Total score → tier mapping:
--   0–9   → tier 0 (محله ساده,        ×1.00, +0/day)
--   10–29 → tier 1 (محله در حال رشد,  ×1.10, +1/day)
--   30–59 → tier 2 (محله متوسط,       ×1.25, +3/day)
--   60–99 → tier 3 (محله خوب,         ×1.45, +6/day)
--   100–159 → tier 4 (محله برتر,      ×1.70, +10/day)
--   160+  → tier 5 (محله لوکس,        ×2.00, +15/day)

-- ─── 4. RPC: recompute_neighborhood_amenity ──────────────────────────────────
-- Called by trigger after any asset change in a neighborhood.
-- Recomputes amenity_score → derives tier → sets cost_multiplier & neighborhood_daily_drip.

CREATE OR REPLACE FUNCTION public.recompute_neighborhood_amenity(p_neighborhood_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score  INTEGER;
  v_tier   INTEGER;
  v_mult   NUMERIC(4, 2);
  v_drip   INTEGER;
BEGIN
  IF p_neighborhood_id IS NULL THEN RETURN; END IF;

  -- Sum amenity weights for all assets in this neighborhood
  -- Weight lookup is inlined so no extra table is needed.
  SELECT COALESCE(SUM(
    CASE a.type
      -- Residential
      WHEN 'house'           THEN 1
      WHEN 'villa'           THEN 2
      WHEN 'tower'           THEN 4
      WHEN 'main_house'      THEN 2
      WHEN 'resident_house'  THEN 1
      -- Commercial
      WHEN 'shop'            THEN 2
      WHEN 'cafe'            THEN 2
      WHEN 'gym'             THEN 3
      WHEN 'warehouse'       THEN 1
      WHEN 'exchange'        THEN 3
      WHEN 'mall'            THEN 7
      WHEN 'restaurant'      THEN 2
      WHEN 'market'          THEN 2
      WHEN 'office'          THEN 3
      -- Industrial
      WHEN 'farm'            THEN 1
      WHEN 'factory'         THEN 2
      -- Public
      WHEN 'hospital'        THEN 8
      WHEN 'park'            THEN 5
      WHEN 'university'      THEN 10
      WHEN 'bank'            THEN 6
      -- Military / legacy
      WHEN 'barracks'        THEN 1
      ELSE 1  -- unknown / custom building types get a base weight of 1
    END
  ), 0)
  INTO v_score
  FROM public.assets a
  WHERE a.neighborhood_id = p_neighborhood_id;

  -- Derive tier from score
  v_tier := CASE
    WHEN v_score >= 160 THEN 5
    WHEN v_score >= 100 THEN 4
    WHEN v_score >=  60 THEN 3
    WHEN v_score >=  30 THEN 2
    WHEN v_score >=  10 THEN 1
    ELSE 0
  END;

  -- Cost multiplier per tier
  v_mult := CASE v_tier
    WHEN 5 THEN 2.00
    WHEN 4 THEN 1.70
    WHEN 3 THEN 1.45
    WHEN 2 THEN 1.25
    WHEN 1 THEN 1.10
    ELSE        1.00
  END;

  -- Daily drip per tier
  v_drip := CASE v_tier
    WHEN 5 THEN 15
    WHEN 4 THEN 10
    WHEN 3 THEN  6
    WHEN 2 THEN  3
    WHEN 1 THEN  1
    ELSE         0
  END;

  UPDATE public.neighborhoods
     SET amenity_score           = v_score,
         amenity_tier            = v_tier,
         cost_multiplier         = v_mult,
         neighborhood_daily_drip = v_drip
   WHERE id = p_neighborhood_id;
END;
$$;

-- ─── 5. Trigger: update_neighborhood_amenity ─────────────────────────────────
-- Fires after any asset INSERT / UPDATE / DELETE that affects neighborhood_id.
-- Handles BOTH old and new neighborhood IDs so a re-assignment recomputes both sides.

CREATE OR REPLACE FUNCTION public._trigger_neighborhood_amenity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On DELETE: recompute the old neighborhood
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_neighborhood_amenity(OLD.neighborhood_id);
    RETURN OLD;
  END IF;

  -- On INSERT: recompute the new neighborhood
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_neighborhood_amenity(NEW.neighborhood_id);
    RETURN NEW;
  END IF;

  -- On UPDATE: recompute both if neighborhood changed, else just new
  IF TG_OP = 'UPDATE' THEN
    IF OLD.neighborhood_id IS DISTINCT FROM NEW.neighborhood_id THEN
      PERFORM public.recompute_neighborhood_amenity(OLD.neighborhood_id);
    END IF;
    PERFORM public.recompute_neighborhood_amenity(NEW.neighborhood_id);
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_neighborhood_amenity ON public.assets;
CREATE TRIGGER update_neighborhood_amenity
  AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public._trigger_neighborhood_amenity();

-- ─── 6. RPC: claim_neighborhood_drip ─────────────────────────────────────────
-- Called manually by the client when the player opens the app (or taps "Collect").
-- One claim per player per 20-hour window (allows players in different time zones to
-- claim at a consistent in-day moment without strict UTC midnight alignment).
--
-- Logic:
--   1. Check cooldown (20h). If still in cooldown, return remaining seconds.
--   2. Find all DISTINCT neighborhoods where the player owns at least one asset.
--   3. Sum neighborhood_daily_drip for those neighborhoods.
--   4. Apply power += drip_total; log game_event; update last_neighborhood_drip_at.
--
-- Returns JSONB with success, drip_total, neighborhoods_count, next_claim_at.

CREATE OR REPLACE FUNCTION public.claim_neighborhood_drip()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id           UUID := auth.uid();
  v_last_claim          TIMESTAMPTZ;
  v_cooldown_seconds    INTEGER := 72000; -- 20 hours
  v_remaining_seconds   FLOAT;
  v_drip_total          INTEGER := 0;
  v_neighborhoods_count INTEGER := 0;
  v_next_claim_at       TIMESTAMPTZ;
  v_neighborhood_ids    TEXT[];
BEGIN
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Lock the player row for atomic update
  SELECT last_neighborhood_drip_at
    INTO v_last_claim
    FROM public.profiles
   WHERE id = v_player_id
   FOR UPDATE;

  -- Enforce 20-hour cooldown
  IF v_last_claim IS NOT NULL THEN
    v_remaining_seconds := EXTRACT(EPOCH FROM (v_last_claim + make_interval(secs => v_cooldown_seconds) - NOW()));
    IF v_remaining_seconds > 0 THEN
      RETURN jsonb_build_object(
        'success',           false,
        'error',             'cooldown_active',
        'remaining_seconds', v_remaining_seconds,
        'next_claim_at',     v_last_claim + make_interval(secs => v_cooldown_seconds)
      );
    END IF;
  END IF;

  -- Gather distinct neighborhoods where player owns at least one asset
  SELECT ARRAY_AGG(DISTINCT a.neighborhood_id),
         COUNT(DISTINCT a.neighborhood_id)
    INTO v_neighborhood_ids, v_neighborhoods_count
    FROM public.assets a
   WHERE a.owner_id       = v_player_id
     AND a.neighborhood_id IS NOT NULL;

  IF v_neighborhoods_count = 0 OR v_neighborhood_ids IS NULL THEN
    RETURN jsonb_build_object(
      'success',             false,
      'error',               'no_neighborhood_assets',
      'neighborhoods_count', 0,
      'drip_total',          0
    );
  END IF;

  -- Sum drip from each qualifying neighborhood
  SELECT COALESCE(SUM(neighborhood_daily_drip), 0)
    INTO v_drip_total
    FROM public.neighborhoods
   WHERE id = ANY(v_neighborhood_ids);

  v_next_claim_at := NOW() + make_interval(secs => v_cooldown_seconds);

  IF v_drip_total > 0 THEN
    -- Apply power bonus and update claim timestamp atomically
    UPDATE public.profiles
       SET power                      = power + v_drip_total,
           power_xp                   = power_xp + v_drip_total,
           last_neighborhood_drip_at  = NOW()
     WHERE id = v_player_id;

    -- Advance tier if XP threshold met (mirrors collect_daily_power logic)
    UPDATE public.profiles
       SET power_tier = CASE
           WHEN power >= 2001 THEN 6
           WHEN power >= 501  THEN 5
           WHEN power >= 151  THEN 4
           WHEN power >= 51   THEN 3
           WHEN power >= 21   THEN 2
           ELSE 1
         END
     WHERE id = v_player_id;

    -- Log game event
    INSERT INTO public.game_events (player_id, type, payload)
    VALUES (
      v_player_id,
      'neighborhood_power_drip',
      jsonb_build_object(
        'drip_total',          v_drip_total,
        'neighborhoods_count', v_neighborhoods_count,
        'neighborhood_ids',    v_neighborhood_ids,
        'next_claim_at',       v_next_claim_at
      )
    );
  ELSE
    -- No drip but still update claim timestamp so Tier-0 players don't spam
    UPDATE public.profiles
       SET last_neighborhood_drip_at = NOW()
     WHERE id = v_player_id;
  END IF;

  RETURN jsonb_build_object(
    'success',             true,
    'drip_total',          v_drip_total,
    'neighborhoods_count', v_neighborhoods_count,
    'next_claim_at',       v_next_claim_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_neighborhood_drip() TO authenticated;

-- ─── 7. Helper view: player_neighborhood_drip_preview ───────────────────────
-- Lets the client quickly show what the player would earn on next claim.
-- Readable by the authenticated player only via RLS.

CREATE OR REPLACE VIEW public.player_neighborhood_drip_preview AS
  SELECT
    a.owner_id                                    AS player_id,
    COUNT(DISTINCT a.neighborhood_id)             AS neighborhoods_count,
    COALESCE(SUM(n.neighborhood_daily_drip), 0)   AS total_drip_per_day,
    COALESCE(SUM(n.amenity_score),           0)   AS total_amenity_score
  FROM public.assets a
  JOIN public.neighborhoods n ON n.id = a.neighborhood_id
 WHERE a.neighborhood_id IS NOT NULL
 GROUP BY a.owner_id;

-- ─── 8. Backfill: recompute amenity for all existing neighborhoods ────────────
-- Run once after migration to populate scores for neighborhoods that already have assets.

DO $$
DECLARE
  v_nid TEXT;
BEGIN
  FOR v_nid IN SELECT DISTINCT id FROM public.neighborhoods
  LOOP
    PERFORM public.recompute_neighborhood_amenity(v_nid);
  END LOOP;
  RAISE NOTICE 'Amenity scores backfilled for all existing neighborhoods.';
END $$;

-- ─── 9. Index for the claim RPC performance ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_assets_neighborhood_owner
  ON public.assets(neighborhood_id, owner_id)
  WHERE neighborhood_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_neighborhoods_amenity_tier
  ON public.neighborhoods(amenity_tier);

-- ─── Done ────────────────────────────────────────────────────────────────────
-- Verify with:
--   SELECT id, amenity_score, amenity_tier, cost_multiplier, neighborhood_daily_drip
--     FROM public.neighborhoods
--    LIMIT 20;
