-- ============================================================
--  BuildIran — Build Modes & Institution Type System Migration
--  Run AFTER:
--    1. "Supabase Schema.sql"
--    2. "economy_migration.sql"
--
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. New columns on profiles ──────────────────────────────
-- subsidy_quota:    weekly state-subsidized materials allowance (units, default 5000)
-- subsidy_reset_at: last time the quota was reset by pg_cron

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subsidy_quota    INTEGER     NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS subsidy_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── 2. New columns on assets ────────────────────────────────
-- build_mode:           'fast' (instant, premium) or 'advanced' (tap-to-add)
-- institution_category: 'residential'|'commercial'|'industrial'|'public'
-- license_purchased:    TRUE once the one-time license fee has been paid
-- warehouse_filled:     TRUE when an Industrial provider has filled this Commercial asset

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS build_mode           TEXT    NOT NULL DEFAULT 'fast',
  ADD COLUMN IF NOT EXISTS institution_category TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS license_purchased    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS warehouse_filled     BOOLEAN NOT NULL DEFAULT FALSE;

-- Extend the institution_type CHECK constraint to include all new types.
-- Drop the economy_migration constraint and recreate with the full set.
ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS chk_assets_institution_type;

ALTER TABLE public.assets
  ADD CONSTRAINT chk_assets_institution_type
  CHECK (institution_type IS NULL OR institution_type IN (
    -- Residential
    'home_rent',
    -- Commercial
    'shopping', 'cafe', 'gym', 'restaurant', 'exchange',
    'library', 'mall_service',
    -- Industrial
    'farm_supply', 'factory_supply', 'industrial_supply',
    -- Public
    'hospital', 'university', 'bank_service', 'park_service'
  ));

-- institution_category CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_assets_institution_category'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT chk_assets_institution_category
      CHECK (institution_category IS NULL OR institution_category IN (
        'residential', 'commercial', 'industrial', 'public'
      ));
  END IF;
END $$;

-- build_mode CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_assets_build_mode'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT chk_assets_build_mode
      CHECK (build_mode IN ('fast', 'advanced'));
  END IF;
END $$;

-- ─── 3. New columns on service_transactions ───────────────────
-- provider_power_earned:      power granted to provider (Industrial + Public)
-- provider_popularity_earned: popularity granted to provider (Public only)

ALTER TABLE public.service_transactions
  ADD COLUMN IF NOT EXISTS provider_power_earned      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_popularity_earned INTEGER NOT NULL DEFAULT 0;

-- ─── 4. Table: market_items ───────────────────────────────────
-- Shop owners list construction materials / goods with price and stock.
-- Used by Advanced Build mode to discover items from nearby player-run shops.

CREATE TABLE IF NOT EXISTS public.market_items (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id     UUID    NOT NULL REFERENCES public.assets(id)   ON DELETE CASCADE,
  owner_id     UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id      TEXT    NOT NULL,              -- e.g. 'cement', 'steel', 'wood', 'brick', 'glass'
  name_fa      TEXT    NOT NULL,              -- e.g. 'سیمان', 'فولاد', 'چوب'
  unit_price   BIGINT  NOT NULL DEFAULT 100,  -- cash per unit (set freely by shop owner)
  stock        INTEGER NOT NULL DEFAULT 0,    -- available units
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, item_id)
);

COMMENT ON TABLE public.market_items IS
  'Items listed for sale in player-owned Commercial shops. Used in Advanced Build mode.';

CREATE INDEX IF NOT EXISTS idx_market_items_asset ON public.market_items(asset_id);
CREATE INDEX IF NOT EXISTS idx_market_items_owner ON public.market_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_market_items_item  ON public.market_items(item_id);

ALTER TABLE public.market_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_items_select_all"   ON public.market_items;
CREATE POLICY "market_items_select_all" ON public.market_items
  FOR SELECT USING (true);                        -- anyone can browse shop inventory

DROP POLICY IF EXISTS "market_items_owner_write"  ON public.market_items;
CREATE POLICY "market_items_owner_write" ON public.market_items
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ─── 5. Table: build_material_sessions ───────────────────────
-- Tracks an in-progress Advanced Build before the player confirms.
-- Expires 2 hours after creation; daily pg_cron cleans up expired rows.

CREATE TABLE IF NOT EXISTS public.build_material_sessions (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id             UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_type         TEXT    NOT NULL,
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,
  tile_id               TEXT    NOT NULL,
  -- JSON array of gathered material slots:
  -- [{ slotId, itemId, nameFa, qty, source:'market'|'subsidized',
  --    unitCost, shopAssetId, quotaCost, powerRatio }]
  gathered_slots        JSONB   NOT NULL DEFAULT '[]',
  total_cash_cost       BIGINT  NOT NULL DEFAULT 0,
  total_quota_used      INTEGER NOT NULL DEFAULT 0,
  effective_power_ratio NUMERIC(4,3) NOT NULL DEFAULT 1.000,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  expires_at            TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);

COMMENT ON TABLE public.build_material_sessions IS
  'In-progress Advanced Build sessions. Holds material gathering state before confirmation.';

CREATE INDEX IF NOT EXISTS idx_build_sessions_player  ON public.build_material_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_build_sessions_expires ON public.build_material_sessions(expires_at);

ALTER TABLE public.build_material_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "build_sessions_own" ON public.build_material_sessions;
CREATE POLICY "build_sessions_own" ON public.build_material_sessions
  FOR ALL USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- ─── 6. Indexes for new asset columns ────────────────────────

CREATE INDEX IF NOT EXISTS idx_assets_category   ON public.assets(institution_category);
CREATE INDEX IF NOT EXISTS idx_assets_build_mode ON public.assets(build_mode);
CREATE INDEX IF NOT EXISTS idx_assets_warehouse  ON public.assets(warehouse_filled) WHERE warehouse_filled = TRUE;

-- ─── 7. RPC: use_subsidy ─────────────────────────────────────
-- Atomically deducts p_quota units from the calling player's subsidy_quota.
-- Called inside add_material_to_session for subsidized items.
-- Returns FALSE if the player has insufficient quota.

CREATE OR REPLACE FUNCTION public.use_subsidy(
  p_quota INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID := auth.uid();
  v_current   INTEGER;
BEGIN
  IF v_player_id IS NULL THEN RETURN FALSE; END IF;
  IF p_quota <= 0 THEN RETURN TRUE; END IF;

  SELECT subsidy_quota INTO v_current
    FROM public.profiles
   WHERE id = v_player_id
   FOR UPDATE;

  IF v_current IS NULL OR v_current < p_quota THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
     SET subsidy_quota = subsidy_quota - p_quota
   WHERE id = v_player_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_subsidy(INTEGER) TO authenticated;

-- ─── 8. RPC: start_advanced_build ────────────────────────────
-- Creates a new Advanced Build session (empty gathered_slots).
-- Client calls add_material_to_session repeatedly, then confirm_advanced_build.

CREATE OR REPLACE FUNCTION public.start_advanced_build(
  p_building_type TEXT,
  p_latitude      DOUBLE PRECISION,
  p_longitude     DOUBLE PRECISION,
  p_tile_id       TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id  UUID := auth.uid();
  v_session_id UUID;
BEGIN
  IF v_player_id IS NULL THEN RETURN NULL; END IF;

  -- Clean up expired sessions for this player
  DELETE FROM public.build_material_sessions
   WHERE player_id = v_player_id AND expires_at < NOW();

  INSERT INTO public.build_material_sessions (
    player_id, building_type, latitude, longitude, tile_id
  )
  VALUES (v_player_id, p_building_type, p_latitude, p_longitude, p_tile_id)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_advanced_build(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO authenticated;

-- ─── 9. RPC: add_material_to_session ─────────────────────────
-- Appends (or replaces) one gathered material slot to a build session.
-- 'market' source: deducts cash from builder, credits shop owner, decrements stock.
-- 'subsidized' source: deducts subsidy_quota from builder.
-- Recomputes running totals (total_cash_cost, total_quota_used, effective_power_ratio).

CREATE OR REPLACE FUNCTION public.add_material_to_session(
  p_session_id    UUID,
  p_slot_id       TEXT,     -- unique slot key, e.g. 'cement_slot'
  p_item_id       TEXT,     -- material code, e.g. 'cement'
  p_item_name_fa  TEXT,
  p_qty           INTEGER,
  p_source        TEXT,     -- 'market' or 'subsidized'
  p_unit_cost     BIGINT,   -- cash per unit (0 if subsidized state price is handled client-side)
  p_quota_cost    INTEGER,  -- quota units per qty (0 if market)
  p_power_ratio   NUMERIC,  -- 1.000 for market, 0.700 for subsidized
  p_shop_asset_id UUID DEFAULT NULL  -- required when source = 'market'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id   UUID := auth.uid();
  v_session     RECORD;
  v_player_cash BIGINT;
  v_total_cash  BIGINT;
  v_total_quota INTEGER;
  v_shop_owner  UUID;
  v_new_slot    JSONB;
  v_slots       JSONB;
  v_slot_exists BOOLEAN;
BEGIN
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Validate session
  SELECT * INTO v_session
    FROM public.build_material_sessions
   WHERE id = p_session_id AND player_id = v_player_id AND expires_at > NOW()
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found_or_expired');
  END IF;

  -- Check if slot was already gathered (allow replacement)
  v_slot_exists := EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_session.gathered_slots) elem
     WHERE elem->>'slotId' = p_slot_id
  );

  v_total_cash  := p_qty::BIGINT * p_unit_cost;
  v_total_quota := p_qty * p_quota_cost;

  IF p_source = 'market' THEN
    IF p_shop_asset_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'shop_asset_required_for_market');
    END IF;

    SELECT owner_id INTO v_shop_owner
      FROM public.assets WHERE id = p_shop_asset_id FOR UPDATE;

    IF v_shop_owner IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'shop_not_found');
    END IF;
    IF v_shop_owner = v_player_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'cannot_buy_from_own_shop');
    END IF;

    -- Check stock availability
    PERFORM 1 FROM public.market_items
      WHERE asset_id = p_shop_asset_id AND item_id = p_item_id AND stock >= p_qty
      FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_stock');
    END IF;

    -- Check builder cash
    SELECT cash INTO v_player_cash FROM public.profiles WHERE id = v_player_id FOR UPDATE;
    IF v_player_cash < v_total_cash THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
    END IF;

    -- Transfer cash and decrement stock
    UPDATE public.profiles SET cash = cash - v_total_cash WHERE id = v_player_id;
    UPDATE public.profiles SET cash = cash + v_total_cash WHERE id = v_shop_owner;
    UPDATE public.market_items
       SET stock = stock - p_qty, updated_at = NOW()
     WHERE asset_id = p_shop_asset_id AND item_id = p_item_id;

  ELSIF p_source = 'subsidized' THEN
    -- Check and deduct subsidy quota
    PERFORM 1 FROM public.profiles
      WHERE id = v_player_id AND subsidy_quota >= v_total_quota
      FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_subsidy_quota');
    END IF;
    UPDATE public.profiles
       SET subsidy_quota = subsidy_quota - v_total_quota
     WHERE id = v_player_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_source');
  END IF;

  -- Build new slot JSONB
  v_new_slot := jsonb_build_object(
    'slotId',       p_slot_id,
    'itemId',       p_item_id,
    'nameFa',       p_item_name_fa,
    'qty',          p_qty,
    'source',       p_source,
    'unitCost',     p_unit_cost,
    'quotaCost',    p_quota_cost,
    'powerRatio',   p_power_ratio,
    'shopAssetId',  p_shop_asset_id
  );

  -- Replace existing slot or append
  IF v_slot_exists THEN
    v_slots := (
      SELECT jsonb_agg(
        CASE WHEN (elem->>'slotId') = p_slot_id THEN v_new_slot ELSE elem END
      )
      FROM jsonb_array_elements(v_session.gathered_slots) elem
    );
  ELSE
    v_slots := v_session.gathered_slots || jsonb_build_array(v_new_slot);
  END IF;

  -- Recompute running totals
  UPDATE public.build_material_sessions
     SET gathered_slots        = v_slots,
         total_cash_cost       = (
           SELECT COALESCE(SUM((e->>'unitCost')::BIGINT * (e->>'qty')::INTEGER), 0)
             FROM jsonb_array_elements(v_slots) e
            WHERE e->>'source' = 'market'
         ),
         total_quota_used      = (
           SELECT COALESCE(SUM((e->>'quotaCost')::INTEGER * (e->>'qty')::INTEGER), 0)
             FROM jsonb_array_elements(v_slots) e
            WHERE e->>'source' = 'subsidized'
         ),
         effective_power_ratio = (
           SELECT ROUND(COALESCE(AVG((e->>'powerRatio')::NUMERIC), 1.000), 3)
             FROM jsonb_array_elements(v_slots) e
         )
   WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success',    true,
    'slotId',     p_slot_id,
    'cashSpent',  v_total_cash,
    'quotaUsed',  v_total_quota,
    'powerRatio', p_power_ratio
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_material_to_session(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, BIGINT, INTEGER, NUMERIC, UUID) TO authenticated;

-- ─── 10. RPC: confirm_advanced_build ─────────────────────────
-- Validates the session, deducts license fee (if non-residential), inserts asset,
-- applies effective_power_ratio to the base power bonus, removes the session.

CREATE OR REPLACE FUNCTION public.confirm_advanced_build(
  p_session_id       UUID,
  p_base_power_bonus INTEGER,   -- from BUILDING_CONFIG on client
  p_market_value     BIGINT,
  p_income_rate      BIGINT,
  p_daily_power_drip INTEGER,
  p_institution_type TEXT,      -- nullable as ''
  p_institution_cat  TEXT,      -- nullable as ''
  p_license_fee      BIGINT     -- 0 for residential
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id   UUID := auth.uid();
  v_session     RECORD;
  v_final_power INTEGER;
  v_player_cash BIGINT;
  v_asset_id    UUID;
BEGIN
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_session
    FROM public.build_material_sessions
   WHERE id = p_session_id AND player_id = v_player_id AND expires_at > NOW()
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found_or_expired');
  END IF;

  -- Power bonus scaled by material mix ratio
  v_final_power := GREATEST(1, FLOOR(p_base_power_bonus::NUMERIC * v_session.effective_power_ratio));

  -- Deduct license fee if applicable
  IF p_license_fee > 0 THEN
    SELECT cash INTO v_player_cash FROM public.profiles WHERE id = v_player_id FOR UPDATE;
    IF v_player_cash < p_license_fee THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash_for_license');
    END IF;
    UPDATE public.profiles SET cash = cash - p_license_fee WHERE id = v_player_id;
  END IF;

  -- Insert asset
  INSERT INTO public.assets (
    owner_id, type, latitude, longitude, tile_id,
    market_value, power_bonus, income_rate, daily_power_drip,
    institution_type, institution_category,
    build_mode, license_purchased
  )
  VALUES (
    v_player_id,
    v_session.building_type,
    v_session.latitude,
    v_session.longitude,
    v_session.tile_id,
    p_market_value,
    v_final_power,
    p_income_rate,
    p_daily_power_drip,
    NULLIF(p_institution_type, ''),
    NULLIF(p_institution_cat, ''),
    'advanced',
    (p_license_fee > 0)
  )
  RETURNING id INTO v_asset_id;

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_player_id, 'building_built', jsonb_build_object(
    'asset_id',      v_asset_id,
    'asset_type',    v_session.building_type,
    'build_mode',    'advanced',
    'power_ratio',   v_session.effective_power_ratio,
    'final_power',   v_final_power,
    'license_fee',   p_license_fee
  ));

  -- Cleanup session
  DELETE FROM public.build_material_sessions WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success',     true,
    'assetId',     v_asset_id,
    'finalPower',  v_final_power,
    'powerRatio',  v_session.effective_power_ratio,
    'licenseFee',  p_license_fee
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_advanced_build(UUID, INTEGER, BIGINT, BIGINT, INTEGER, TEXT, TEXT, BIGINT) TO authenticated;

-- ─── 11. RPC: buy_license ─────────────────────────────────────
-- One-time license fee payment for an existing asset.
-- Idempotent: returns success immediately if already licensed.
-- Used by both Fast mode (called after asset insert) and
-- Advanced mode (handled inside confirm_advanced_build, but callable standalone).

CREATE OR REPLACE FUNCTION public.buy_license(
  p_asset_id    UUID,
  p_license_fee BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID := auth.uid();
  v_asset    RECORD;
  v_cash     BIGINT;
BEGIN
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT owner_id, license_purchased INTO v_asset
    FROM public.assets WHERE id = p_asset_id FOR UPDATE;

  IF v_asset.owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'asset_not_found');
  END IF;
  IF v_asset.owner_id != v_owner_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_owner');
  END IF;
  IF v_asset.license_purchased THEN
    RETURN jsonb_build_object('success', true, 'alreadyLicensed', true);
  END IF;

  SELECT cash INTO v_cash FROM public.profiles WHERE id = v_owner_id FOR UPDATE;
  IF v_cash < p_license_fee THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;

  UPDATE public.profiles SET cash = cash - p_license_fee WHERE id = v_owner_id;
  UPDATE public.assets SET license_purchased = TRUE WHERE id = p_asset_id;

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_owner_id, 'license_purchased', jsonb_build_object(
    'asset_id', p_asset_id,
    'fee',      p_license_fee
  ));

  RETURN jsonb_build_object('success', true, 'licenseFee', p_license_fee);
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_license(UUID, BIGINT) TO authenticated;

-- ─── 12. RPC: fill_warehouse ──────────────────────────────────
-- An Industrial provider (farm/factory owner) fills a Commercial warehouse.
-- Awards cash + power to the provider; marks commercial asset warehouse_filled = TRUE.

CREATE OR REPLACE FUNCTION public.fill_warehouse(
  p_industrial_asset_id UUID,
  p_commercial_asset_id UUID,
  p_cash_reward         BIGINT,
  p_power_reward        INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID := auth.uid();
  v_ind_owner   UUID;
  v_com_owner   UUID;
BEGIN
  IF v_provider_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Validate industrial asset ownership
  SELECT owner_id INTO v_ind_owner
    FROM public.assets
   WHERE id = p_industrial_asset_id AND institution_category = 'industrial'
   FOR UPDATE;

  IF v_ind_owner IS NULL OR v_ind_owner != v_provider_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_industrial_owner');
  END IF;

  -- Validate commercial target
  SELECT owner_id INTO v_com_owner
    FROM public.assets
   WHERE id = p_commercial_asset_id AND institution_category = 'commercial'
   FOR UPDATE;

  IF v_com_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'commercial_asset_not_found');
  END IF;

  -- Reward provider
  UPDATE public.profiles
     SET cash  = cash  + p_cash_reward,
         power = power + p_power_reward
   WHERE id = v_provider_id;

  -- Mark warehouse filled
  UPDATE public.assets SET warehouse_filled = TRUE WHERE id = p_commercial_asset_id;

  -- Log in service_transactions
  INSERT INTO public.service_transactions (
    business_asset_id, provider_id, client_id, institution_type,
    client_cost_stat, client_cost_amount,
    client_gain_stat, client_gain_amount,
    provider_activity_spent, provider_cash_earned, provider_power_earned
  ) VALUES (
    p_commercial_asset_id, v_provider_id, v_com_owner, 'industrial_supply',
    'none', 0, 'none', 0,
    0, p_cash_reward, p_power_reward
  );

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_provider_id, 'warehouse_filled', jsonb_build_object(
    'industrial_asset', p_industrial_asset_id,
    'commercial_asset', p_commercial_asset_id,
    'cash_reward',      p_cash_reward,
    'power_reward',     p_power_reward
  ));

  RETURN jsonb_build_object(
    'success',     true,
    'cashEarned',  p_cash_reward,
    'powerEarned', p_power_reward
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fill_warehouse(UUID, UUID, BIGINT, INTEGER) TO authenticated;

-- ─── 13. RPC: use_institution (REPLACE — adds provider power/popularity) ──────
-- Drops and recreates use_institution with two new optional parameters:
--   p_provider_power_gain    INTEGER  DEFAULT 0
--   p_provider_popularity_gain INTEGER DEFAULT 0
--   p_requires_warehouse     BOOLEAN  DEFAULT FALSE
-- All existing callers pass 0/FALSE for the new params → backward compatible.

DROP FUNCTION IF EXISTS public.use_institution(UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, INTEGER, BIGINT);

CREATE OR REPLACE FUNCTION public.use_institution(
  p_asset_id                 UUID,
  p_institution_type         TEXT,
  p_client_cost_stat         TEXT,     -- 'cash' or 'activity'
  p_client_cost_amt          BIGINT,
  p_client_cost2_stat        TEXT     DEFAULT NULL, -- optional secondary cost
  p_client_cost2_amt         BIGINT   DEFAULT 0,
  p_client_gain_stat         TEXT,     -- 'power' or 'cash'
  p_client_gain_amt          BIGINT,
  p_provider_activity_cost   INTEGER  DEFAULT 0,
  p_provider_cash_share      BIGINT   DEFAULT 0,
  p_provider_power_gain      INTEGER  DEFAULT 0,
  p_provider_popularity_gain INTEGER  DEFAULT 0,
  p_requires_warehouse       BOOLEAN  DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id        UUID := auth.uid();
  v_owner_id         UUID;
  v_client_cash      BIGINT;
  v_client_activity  INTEGER;
  v_prov_activity    INTEGER;
  v_warehouse_filled BOOLEAN;
BEGIN
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT owner_id, warehouse_filled INTO v_owner_id, v_warehouse_filled
    FROM public.assets WHERE id = p_asset_id FOR UPDATE;

  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'asset_not_found');
  END IF;

  -- Warehouse gate for large Commercial
  IF p_requires_warehouse AND NOT COALESCE(v_warehouse_filled, FALSE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'warehouse_empty');
  END IF;

  -- Owner cannot use their own business (except system-run types)
  IF v_owner_id = v_client_id
    AND p_institution_type NOT IN ('home_rent', 'exchange', 'industrial_supply')
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_use_own_institution');
  END IF;

  SELECT cash, activity INTO v_client_cash, v_client_activity
    FROM public.profiles WHERE id = v_client_id FOR UPDATE;

  IF p_client_cost_stat = 'cash'     AND v_client_cash     < p_client_cost_amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;
  IF p_client_cost_stat = 'activity' AND v_client_activity < p_client_cost_amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_activity');
  END IF;

  IF p_client_cost2_stat = 'cash'     AND v_client_cash     < (p_client_cost_amt + p_client_cost2_amt) THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;
  IF p_client_cost2_stat = 'activity' AND v_client_activity < (p_client_cost_amt + p_client_cost2_amt) THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_activity');
  END IF;

  IF p_provider_activity_cost > 0 THEN
    SELECT activity INTO v_prov_activity
      FROM public.profiles WHERE id = v_owner_id FOR UPDATE;
    IF v_prov_activity < p_provider_activity_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'provider_insufficient_activity');
    END IF;
  END IF;

  -- Apply client cost
  IF p_client_cost_stat = 'cash' THEN
    UPDATE public.profiles SET cash     = cash     - p_client_cost_amt WHERE id = v_client_id;
  ELSE
    UPDATE public.profiles SET activity = activity - p_client_cost_amt WHERE id = v_client_id;
  END IF;

  IF p_client_cost2_stat = 'cash' THEN
    UPDATE public.profiles SET cash     = cash     - p_client_cost2_amt WHERE id = v_client_id;
  ELSIF p_client_cost2_stat = 'activity' THEN
    UPDATE public.profiles SET activity = activity - p_client_cost2_amt WHERE id = v_client_id;
  END IF;

  -- Apply client gain
  IF p_client_gain_stat = 'power' THEN
    UPDATE public.profiles SET power = power + p_client_gain_amt WHERE id = v_client_id;
  ELSE
    UPDATE public.profiles SET cash  = cash  + p_client_gain_amt WHERE id = v_client_id;
  END IF;

  -- Apply provider gains / costs
  IF p_provider_activity_cost > 0 THEN
    UPDATE public.profiles SET activity   = activity   - p_provider_activity_cost WHERE id = v_owner_id;
  END IF;
  IF p_provider_cash_share > 0 THEN
    UPDATE public.profiles SET cash       = cash       + p_provider_cash_share     WHERE id = v_owner_id;
  END IF;
  IF p_provider_power_gain > 0 THEN
    UPDATE public.profiles SET power      = power      + p_provider_power_gain     WHERE id = v_owner_id;
  END IF;
  IF p_provider_popularity_gain > 0 THEN
    UPDATE public.profiles SET popularity = popularity + p_provider_popularity_gain WHERE id = v_owner_id;
  END IF;

  -- Log transaction (extended)
  INSERT INTO public.service_transactions (
    business_asset_id, provider_id, client_id, institution_type,
    client_cost_stat,   client_cost_amount,
    client_gain_stat,   client_gain_amount,
    provider_activity_spent, provider_cash_earned,
    provider_power_earned,   provider_popularity_earned
  ) VALUES (
    p_asset_id, v_owner_id, v_client_id, p_institution_type,
    p_client_cost_stat,  p_client_cost_amt,
    p_client_gain_stat,  p_client_gain_amt,
    p_provider_activity_cost, p_provider_cash_share,
    p_provider_power_gain,    p_provider_popularity_gain
  );

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_client_id, 'service_used', jsonb_build_object(
    'asset_id',           p_asset_id,
    'institution_type',   p_institution_type,
    'client_cost_stat',   p_client_cost_stat,
    'client_cost_amount', p_client_cost_amt,
    'client_gain_stat',   p_client_gain_stat,
    'client_gain_amount', p_client_gain_amt
  ));

  RETURN jsonb_build_object(
    'success',                  true,
    'clientGainStat',           p_client_gain_stat,
    'clientGainAmount',         p_client_gain_amt,
    'providerCashEarned',       p_provider_cash_share,
    'providerPowerEarned',      p_provider_power_gain,
    'providerPopularityEarned', p_provider_popularity_gain
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_institution(UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, INTEGER, BIGINT, INTEGER, INTEGER, BOOLEAN) TO authenticated;

-- ─── 14. RPC: reset_weekly_subsidy (pg_cron job) ──────────────
-- Runs every Monday 00:00 UTC. Restores subsidy_quota to 5000 for all players.

CREATE OR REPLACE FUNCTION public.reset_weekly_subsidy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET subsidy_quota    = 5000,
         subsidy_reset_at = NOW()
   WHERE subsidy_quota < 5000;  -- only those who consumed some
END;
$$;

-- ─── 15. RPC: cleanup_expired_build_sessions (pg_cron job) ───
-- Runs daily at 03:00 UTC. Removes expired Advanced Build sessions.
-- NOTE: Cash/quota paid per slot is NOT refunded (abandoned builds).

CREATE OR REPLACE FUNCTION public.cleanup_expired_build_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.build_material_sessions WHERE expires_at < NOW();
END;
$$;

-- ─── 16. pg_cron schedules ────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- Weekly subsidy reset (Monday 00:00 UTC)
    PERFORM cron.unschedule('buildiran-weekly-subsidy-reset')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'buildiran-weekly-subsidy-reset');
    PERFORM cron.schedule(
      'buildiran-weekly-subsidy-reset',
      '0 0 * * 1',
      'SELECT public.reset_weekly_subsidy();'
    );

    -- Daily session cleanup (03:00 UTC, after midnight power drip)
    PERFORM cron.unschedule('buildiran-cleanup-build-sessions')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'buildiran-cleanup-build-sessions');
    PERFORM cron.schedule(
      'buildiran-cleanup-build-sessions',
      '0 3 * * *',
      'SELECT public.cleanup_expired_build_sessions();'
    );

    RAISE NOTICE 'pg_cron: weekly subsidy reset + daily session cleanup scheduled.';
  ELSE
    RAISE NOTICE 'pg_cron not active. Enable in Supabase → Database → Extensions.';
  END IF;
END $$;

-- ─── 17. RPC: buy_license ─────────────────────────────────────
-- Deducts cash from the caller and sets license_purchased = true on the asset.

CREATE OR REPLACE FUNCTION public.buy_license(
  p_asset_id UUID,
  p_fee      BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID := auth.uid();
  v_cash      BIGINT;
  v_owner_id  UUID;
BEGIN
  IF v_player_id IS NULL THEN RETURN FALSE; END IF;

  SELECT owner_id INTO v_owner_id
    FROM public.assets
   WHERE id = p_asset_id;

  IF v_owner_id IS NULL OR v_owner_id != v_player_id THEN
    RETURN FALSE;
  END IF;

  IF p_fee > 0 THEN
    SELECT cash INTO v_cash
      FROM public.profiles
     WHERE id = v_player_id
     FOR UPDATE;
    
    IF v_cash < p_fee THEN
      RETURN FALSE;
    END IF;

    UPDATE public.profiles
       SET cash = cash - p_fee
     WHERE id = v_player_id;
  END IF;

  UPDATE public.assets
     SET license_purchased = TRUE
   WHERE id = p_asset_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_license(UUID, BIGINT) TO authenticated;

-- ─── 18. RPC: fill_warehouse ──────────────────────────────────
-- Links an Industrial asset to a Commercial asset to fill its warehouse.
-- Deducts activity from Industrial provider. Sets warehouse_filled = true.
-- Awards power to the Industrial provider based on p_provider_power_gain.

CREATE OR REPLACE FUNCTION public.fill_warehouse(
  p_industrial_asset_id UUID,
  p_commercial_asset_id UUID,
  p_cash_reward         BIGINT,
  p_power_reward        INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID := auth.uid();
  v_comm_owner  UUID;
  v_ind_owner   UUID;
  v_ind_type    TEXT;
BEGIN
  IF v_provider_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  -- Validate industrial asset
  SELECT owner_id, institution_type INTO v_ind_owner, v_ind_type
    FROM public.assets
   WHERE id = p_industrial_asset_id;
   
  IF v_ind_owner IS NULL OR v_ind_owner != v_provider_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_owner');
  END IF;
  IF v_ind_type NOT IN ('farm_supply', 'factory_supply', 'industrial_supply') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_industrial_type');
  END IF;

  -- Validate commercial asset
  SELECT owner_id INTO v_comm_owner
    FROM public.assets
   WHERE id = p_commercial_asset_id
     FOR UPDATE;
     
  IF v_comm_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'commercial_not_found');
  END IF;

  -- Apply gains to provider
  IF p_cash_reward > 0 THEN
    UPDATE public.profiles SET cash = cash + p_cash_reward WHERE id = v_provider_id;
  END IF;

  IF p_power_reward > 0 THEN
    UPDATE public.profiles SET power = power + p_power_reward WHERE id = v_provider_id;
  END IF;

  -- Fill the warehouse
  UPDATE public.assets
     SET warehouse_filled = TRUE
   WHERE id = p_commercial_asset_id;

  RETURN jsonb_build_object(
    'success', true,
    'cashEarned', p_cash_reward,
    'powerEarned', p_power_reward
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fill_warehouse(UUID, UUID, BIGINT, INTEGER) TO authenticated;
