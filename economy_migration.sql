-- ============================================================
--  BuildIran — Economy System Migration
--  4-Factor Economy: Power / Wealth / Activity / Popularity
--  Run AFTER the base "Supabase Schema.sql"
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. New columns on profiles ──────────────────────────────
-- power_tier: cached tier index (1–6), updated by collect_daily_power()
-- power_xp:   XP accumulated within the current tier
-- activity_last_reset: timestamp of the last daily activity reset

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS power_tier   INTEGER     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS power_xp     INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_last_reset TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── 2. New columns on assets ────────────────────────────────
-- income_rate:       hourly cash income from this asset (set at build time)
-- total_views:       cached lifetime viewport view count
-- daily_power_drip:  power drip contributed to owner daily (pg_cron)
-- institution_type:  which service this asset provides (NULL = no service)

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS income_rate       BIGINT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_views       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_power_drip  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS institution_type  TEXT    REFERENCES NULL
    CHECK (institution_type IN (
      'home_rent','shopping','hospital','university',
      'cafe','gym','library','exchange'
    ));

-- ─── 3. Table: asset_views ────────────────────────────────────
-- Passive viewport views. One unique record per viewer per asset per day.
-- Used to grant popularity to asset owners and power engagement dashboards.

CREATE TABLE IF NOT EXISTS public.asset_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID NOT NULL REFERENCES public.assets(id)   ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One view per viewer per asset per day (date part only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_views_unique_daily
  ON public.asset_views(asset_id, viewer_id, (viewed_at::date));

CREATE INDEX IF NOT EXISTS idx_asset_views_owner    ON public.asset_views(owner_id);
CREATE INDEX IF NOT EXISTS idx_asset_views_asset    ON public.asset_views(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_views_date     ON public.asset_views(viewed_at DESC);

COMMENT ON TABLE public.asset_views IS
  'Passive viewport view tracking. Grants popularity to asset owners.';

-- ─── 4. Table: service_transactions ──────────────────────────
-- Logs every institution usage: client pays stat, gains stat,
-- provider pays activity, gains cash share.

CREATE TABLE IF NOT EXISTS public.service_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_asset_id       UUID NOT NULL REFERENCES public.assets(id)   ON DELETE CASCADE,
  provider_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_type        TEXT NOT NULL,
  client_cost_stat        TEXT NOT NULL,       -- 'cash' or 'activity'
  client_cost_amount      BIGINT NOT NULL DEFAULT 0,
  client_gain_stat        TEXT NOT NULL,       -- 'power' or 'cash'
  client_gain_amount      BIGINT NOT NULL DEFAULT 0,
  provider_activity_spent INTEGER NOT NULL DEFAULT 0,
  provider_cash_earned    BIGINT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_tx_client   ON public.service_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_service_tx_provider ON public.service_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_tx_asset    ON public.service_transactions(business_asset_id);
CREATE INDEX IF NOT EXISTS idx_service_tx_type     ON public.service_transactions(institution_type);

COMMENT ON TABLE public.service_transactions IS
  'Logs all institution service uses (client + provider stat changes).';

-- ─── 5. Table: popularity_boosts ─────────────────────────────
-- Active 2× income boosts purchased by business owners with popularity.

CREATE TABLE IF NOT EXISTS public.popularity_boosts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         UUID NOT NULL REFERENCES public.assets(id)   ON DELETE CASCADE,
  owner_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  popularity_spent INTEGER NOT NULL,
  asset_level      INTEGER NOT NULL DEFAULT 1,
  activated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_boosts_asset   ON public.popularity_boosts(asset_id);
CREATE INDEX IF NOT EXISTS idx_boosts_owner   ON public.popularity_boosts(owner_id);
CREATE INDEX IF NOT EXISTS idx_boosts_expires ON public.popularity_boosts(expires_at DESC);

COMMENT ON TABLE public.popularity_boosts IS
  'Popularity-funded 2× income boosts on player-run business assets.';

-- ─── 6. RLS for new tables ───────────────────────────────────

ALTER TABLE public.asset_views         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popularity_boosts   ENABLE ROW LEVEL SECURITY;

-- asset_views: anyone can read; inserts only via RPC (SECURITY DEFINER)
DROP POLICY IF EXISTS "asset_views_select_all" ON public.asset_views;
CREATE POLICY "asset_views_select_all" ON public.asset_views FOR SELECT USING (true);

-- service_transactions: players can read their own (as client or provider)
DROP POLICY IF EXISTS "service_tx_select_own" ON public.service_transactions;
CREATE POLICY "service_tx_select_own" ON public.service_transactions
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- popularity_boosts: owner can read/insert their own
DROP POLICY IF EXISTS "boosts_select_own" ON public.popularity_boosts;
CREATE POLICY "boosts_select_own" ON public.popularity_boosts
  FOR SELECT USING (auth.uid() = owner_id);

-- ─── 7. RPC: use_institution ─────────────────────────────────
-- Atomic institution usage:
--   • Client loses cash OR activity
--   • Client gains power OR cash
--   • Provider loses activity (if applicable)
--   • Provider gains cash share (if applicable)
-- Returns JSON result payload.

CREATE OR REPLACE FUNCTION public.use_institution(
  p_asset_id        UUID,
  p_institution_type TEXT,
  p_client_cost_stat  TEXT,   -- 'cash' or 'activity'
  p_client_cost_amt   BIGINT,
  p_client_gain_stat  TEXT,   -- 'power' or 'cash'
  p_client_gain_amt   BIGINT,
  p_provider_activity_cost INTEGER DEFAULT 0,
  p_provider_cash_share    BIGINT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id  UUID := auth.uid();
  v_owner_id   UUID;
  v_client_cash      BIGINT;
  v_client_activity  INTEGER;
  v_provider_activity INTEGER;
BEGIN
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Get asset owner
  SELECT owner_id INTO v_owner_id FROM public.assets WHERE id = p_asset_id FOR UPDATE;
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'asset_not_found');
  END IF;

  -- Client cannot use their own institution
  IF v_owner_id = v_client_id AND p_institution_type != 'home_rent' AND p_institution_type != 'exchange' THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_use_own_institution');
  END IF;

  -- Lock client row
  SELECT cash, activity INTO v_client_cash, v_client_activity
    FROM public.profiles WHERE id = v_client_id FOR UPDATE;

  -- Check client can afford the cost
  IF p_client_cost_stat = 'cash' AND v_client_cash < p_client_cost_amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;
  IF p_client_cost_stat = 'activity' AND v_client_activity < p_client_cost_amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_activity');
  END IF;

  -- Check provider has enough activity (if applicable)
  IF p_provider_activity_cost > 0 THEN
    SELECT activity INTO v_provider_activity
      FROM public.profiles WHERE id = v_owner_id FOR UPDATE;
    IF v_provider_activity < p_provider_activity_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'provider_insufficient_activity');
    END IF;
  END IF;

  -- Apply client cost
  IF p_client_cost_stat = 'cash' THEN
    UPDATE public.profiles SET cash = cash - p_client_cost_amt WHERE id = v_client_id;
  ELSE
    UPDATE public.profiles SET activity = activity - p_client_cost_amt WHERE id = v_client_id;
  END IF;

  -- Apply client gain
  IF p_client_gain_stat = 'power' THEN
    UPDATE public.profiles SET power = power + p_client_gain_amt WHERE id = v_client_id;
  ELSE
    UPDATE public.profiles SET cash = cash + p_client_gain_amt WHERE id = v_client_id;
  END IF;

  -- Apply provider side (if applicable)
  IF p_provider_activity_cost > 0 THEN
    UPDATE public.profiles SET activity = activity - p_provider_activity_cost WHERE id = v_owner_id;
  END IF;
  IF p_provider_cash_share > 0 THEN
    UPDATE public.profiles SET cash = cash + p_provider_cash_share WHERE id = v_owner_id;
  END IF;

  -- Log the transaction
  INSERT INTO public.service_transactions (
    business_asset_id, provider_id, client_id, institution_type,
    client_cost_stat, client_cost_amount,
    client_gain_stat, client_gain_amount,
    provider_activity_spent, provider_cash_earned
  ) VALUES (
    p_asset_id, v_owner_id, v_client_id, p_institution_type,
    p_client_cost_stat, p_client_cost_amt,
    p_client_gain_stat, p_client_gain_amt,
    p_provider_activity_cost, p_provider_cash_share
  );

  -- Log game event
  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_client_id, 'service_used', jsonb_build_object(
    'asset_id', p_asset_id,
    'institution_type', p_institution_type,
    'client_cost_stat', p_client_cost_stat,
    'client_cost_amount', p_client_cost_amt,
    'client_gain_stat', p_client_gain_stat,
    'client_gain_amount', p_client_gain_amt
  ));

  RETURN jsonb_build_object(
    'success', true,
    'client_gain_stat', p_client_gain_stat,
    'client_gain_amount', p_client_gain_amt,
    'provider_cash_earned', p_provider_cash_share
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_institution(UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, INTEGER, BIGINT) TO authenticated;

-- ─── 8. RPC: record_asset_views ──────────────────────────────
-- Batch-insert passive viewport views.
-- Grants POPULARITY_PER_VIEW (1) popularity to each unique owner per batch.
-- Input: JSONB array of {asset_id, viewer_id, owner_id}

CREATE OR REPLACE FUNCTION public.record_asset_views(p_views JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_view    JSONB;
  v_count   INTEGER := 0;
  v_asset_id   UUID;
  v_viewer_id  UUID;
  v_owner_id   UUID;
BEGIN
  FOR v_view IN SELECT * FROM jsonb_array_elements(p_views)
  LOOP
    v_asset_id  := (v_view->>'asset_id')::UUID;
    v_viewer_id := (v_view->>'viewer_id')::UUID;
    v_owner_id  := (v_view->>'owner_id')::UUID;

    -- Skip self-views
    IF v_viewer_id = v_owner_id THEN CONTINUE; END IF;

    -- Insert unique daily view (ON CONFLICT = already viewed today, skip)
    INSERT INTO public.asset_views (asset_id, viewer_id, owner_id, viewed_at)
    VALUES (v_asset_id, v_viewer_id, v_owner_id, NOW())
    ON CONFLICT (asset_id, viewer_id, (viewed_at::date)) DO NOTHING;

    IF FOUND THEN
      -- Increment owner popularity and asset total_views
      UPDATE public.profiles  SET popularity    = popularity + 1    WHERE id = v_owner_id;
      UPDATE public.assets     SET total_views   = total_views + 1   WHERE id = v_asset_id;
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_asset_views(JSONB) TO authenticated;

-- ─── 9. RPC: activate_popularity_boost ───────────────────────
-- Spends (10 × asset.level) popularity from owner to activate 2× income boost.
-- Non-stackable: a new boost replaces any remaining time on the current one.

CREATE OR REPLACE FUNCTION public.activate_popularity_boost(p_asset_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id     UUID := auth.uid();
  v_asset_level  INTEGER;
  v_boost_cost   INTEGER;
  v_owner_pop    INTEGER;
  v_expires_at   TIMESTAMPTZ;
BEGIN
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT level INTO v_asset_level
    FROM public.assets WHERE id = p_asset_id AND owner_id = v_owner_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'asset_not_found_or_not_owner');
  END IF;

  v_boost_cost := 10 * v_asset_level;

  SELECT popularity INTO v_owner_pop
    FROM public.profiles WHERE id = v_owner_id FOR UPDATE;
  IF v_owner_pop < v_boost_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_popularity',
      'required', v_boost_cost, 'available', v_owner_pop);
  END IF;

  v_expires_at := NOW() + INTERVAL '24 hours';

  -- Deactivate existing boost for this asset (non-stackable)
  DELETE FROM public.popularity_boosts
    WHERE asset_id = p_asset_id AND expires_at > NOW();

  -- Spend popularity
  UPDATE public.profiles SET popularity = popularity - v_boost_cost WHERE id = v_owner_id;

  -- Create new boost
  INSERT INTO public.popularity_boosts (asset_id, owner_id, popularity_spent, asset_level, expires_at)
  VALUES (p_asset_id, v_owner_id, v_boost_cost, v_asset_level, v_expires_at);

  -- Log game event
  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_owner_id, 'popularity_boost_activated', jsonb_build_object(
    'asset_id', p_asset_id,
    'popularity_spent', v_boost_cost,
    'expires_at', v_expires_at
  ));

  RETURN jsonb_build_object(
    'success', true,
    'popularity_spent', v_boost_cost,
    'expires_at', v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_popularity_boost(UUID) TO authenticated;

-- ─── 10. RPC: collect_daily_power (pg_cron job) ───────────────
-- Called daily at midnight UTC by pg_cron.
-- For each player, sums daily_power_drip of all owned assets and
-- adds it to their power. Also checks for tier advancement.

CREATE OR REPLACE FUNCTION public.collect_daily_power()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_drip INTEGER;
BEGIN
  FOR v_rec IN
    SELECT owner_id, SUM(daily_power_drip) AS total_drip
      FROM public.assets
     GROUP BY owner_id
  LOOP
    v_drip := COALESCE(v_rec.total_drip, 0);
    IF v_drip = 0 THEN CONTINUE; END IF;

    UPDATE public.profiles
       SET power    = power + v_drip,
           power_xp = power_xp + v_drip
     WHERE id = v_rec.owner_id;

    -- Advance tier if XP threshold met (tiers: 100, 500, 2000, 10000, 50000)
    UPDATE public.profiles
       SET power_tier = CASE
           WHEN power >= 2001 THEN 6
           WHEN power >= 501  THEN 5
           WHEN power >= 151  THEN 4
           WHEN power >= 51   THEN 3
           WHEN power >= 21   THEN 2
           ELSE 1
         END
     WHERE id = v_rec.owner_id;

    -- Log drip event
    INSERT INTO public.game_events (player_id, type, payload)
    VALUES (v_rec.owner_id, 'daily_power_drip', jsonb_build_object(
      'power_added', v_drip
    ));
  END LOOP;
END;
$$;

-- ─── 11. RPC: reset_daily_activity (pg_cron job) ─────────────
-- Called daily at midnight UTC. Resets all players' activity to 0
-- and updates activity_last_reset timestamp.

CREATE OR REPLACE FUNCTION public.reset_daily_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET activity            = 0,
         activity_last_reset = NOW()
   WHERE activity > 0;
END;
$$;

-- ─── 12. pg_cron Schedules ────────────────────────────────────
-- Requires pg_cron extension to be enabled in Supabase Dashboard:
--   Settings → Database → Extensions → pg_cron
--
-- Run these manually after enabling pg_cron:

SELECT cron.schedule(
  'buildiran-daily-power-drip',
  '0 0 * * *',
  $$ SELECT public.collect_daily_power(); $$
);

SELECT cron.schedule(
  'buildiran-daily-activity-reset',
  '0 0 * * *',
  $$ SELECT public.reset_daily_activity(); $$
);

-- ─── 13. Helper view: active_boosts ──────────────────────────
-- Quick lookup of all currently active popularity boosts.

CREATE OR REPLACE VIEW public.active_boosts AS
  SELECT pb.*, a.owner_id AS asset_owner_id, a.type AS asset_type
    FROM public.popularity_boosts pb
    JOIN public.assets a ON a.id = pb.asset_id
   WHERE pb.expires_at > NOW();

-- ─── 14. Engagement dashboard helper function ─────────────────

CREATE OR REPLACE FUNCTION public.get_engagement_data(p_asset_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_views_today   INTEGER;
  v_views_week    INTEGER;
  v_views_total   INTEGER;
  v_popularity    INTEGER;
  v_top_viewers   JSONB;
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.assets WHERE id = p_asset_id;
  IF v_owner_id IS NULL THEN RETURN NULL; END IF;
  IF auth.uid() != v_owner_id THEN RETURN NULL; END IF;

  SELECT COUNT(*) INTO v_views_today
    FROM public.asset_views
   WHERE asset_id = p_asset_id AND viewed_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_views_week
    FROM public.asset_views
   WHERE asset_id = p_asset_id AND viewed_at >= CURRENT_DATE - INTERVAL '7 days';

  SELECT total_views INTO v_views_total FROM public.assets WHERE id = p_asset_id;

  SELECT SUM(1) INTO v_popularity
    FROM public.asset_views
   WHERE asset_id = p_asset_id;

  SELECT jsonb_agg(sub) INTO v_top_viewers FROM (
    SELECT av.viewer_id AS "playerId", p.username, COUNT(*) AS "viewCount"
      FROM public.asset_views av
      JOIN public.profiles p ON p.id = av.viewer_id
     WHERE av.asset_id = p_asset_id
     GROUP BY av.viewer_id, p.username
     ORDER BY "viewCount" DESC
     LIMIT 10
  ) sub;

  RETURN jsonb_build_object(
    'assetId',         p_asset_id,
    'viewsToday',      COALESCE(v_views_today,  0),
    'viewsThisWeek',   COALESCE(v_views_week,   0),
    'viewsAllTime',    COALESCE(v_views_total,  0),
    'popularityEarned', COALESCE(v_popularity,  0),
    'topViewers',      COALESCE(v_top_viewers,  '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_engagement_data(UUID) TO authenticated;
