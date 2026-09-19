-- ============================================================
--  BuildIran — Career Buffs Migration
--  Patches use_institution() and buy_asset_listing() RPCs to
--  apply career-path buffs (service income bonus, market tax
--  discount) by calling get_career_buff() from
--  careers_and_stories_migration.sql.
--
--  Run AFTER:
--    1. "Supabase Schema.sql"
--    2. "build_modes_v1_migration.sql"
--    3. "careers_and_stories_migration.sql"
--
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. Patch use_institution() ─────────────────────────────────────────────
-- Adds service income buff: 'business' career gets +15% more cash share
-- (multiplier is pulled from get_career_buff to stay DRY)

-- ─── 2. Patch buy_asset_listing() ───────────────────────────────────────────
-- Adds market tax buff: 'trader' career (buyer or seller) gets reduced tax
-- (60% tax reduction → effective rate drops from 5% to 2%)

CREATE OR REPLACE FUNCTION public.use_institution(
  p_asset_id                 UUID,
  p_institution_type         TEXT,
  p_client_cost_stat         TEXT,     -- 'cash' or 'activity'
  p_client_cost_amt          BIGINT,
  p_client_gain_stat         TEXT,     -- 'power' or 'cash'
  p_client_gain_amt          BIGINT,
  p_client_cost2_stat        TEXT     DEFAULT NULL, -- optional secondary cost
  p_client_cost2_amt         BIGINT   DEFAULT 0,
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
  v_is_system        BOOLEAN := FALSE;
  v_cost2_amt        BIGINT := COALESCE(p_client_cost2_amt, 0);
  v_actual_prov_cash_share BIGINT := p_provider_cash_share;
BEGIN
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Handle exchange or system assets gracefully
  IF p_institution_type = 'exchange' AND (p_asset_id IS NULL OR p_asset_id = '00000000-0000-0000-0000-000000000000'::UUID) THEN
    v_owner_id := v_client_id;
    v_is_system := TRUE;
  ELSE
    SELECT owner_id, warehouse_filled INTO v_owner_id, v_warehouse_filled
      FROM public.assets WHERE id = p_asset_id FOR UPDATE;

    IF v_owner_id IS NULL THEN
      IF p_institution_type = 'exchange' THEN
        v_owner_id := v_client_id;
        v_is_system := TRUE;
      ELSE
        RETURN jsonb_build_object('success', false, 'error', 'asset_not_found');
      END IF;
    END IF;
  END IF;

  -- Warehouse gate for large Commercial
  IF p_requires_warehouse AND NOT COALESCE(v_warehouse_filled, FALSE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'warehouse_empty');
  END IF;

  -- Owner cannot use their own business (except system-run types)
  IF NOT v_is_system AND v_owner_id = v_client_id
    AND p_institution_type NOT IN ('home_rent', 'exchange', 'industrial_supply')
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_use_own_institution');
  END IF;

  SELECT cash, activity INTO v_client_cash, v_client_activity
    FROM public.profiles WHERE id = v_client_id FOR UPDATE;

  -- Primary cost check
  IF p_client_cost_stat = 'cash'     AND v_client_cash     < p_client_cost_amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;
  IF p_client_cost_stat = 'activity' AND v_client_activity < p_client_cost_amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_activity');
  END IF;

  -- Secondary cost check
  IF p_client_cost2_stat = 'cash' AND v_cost2_amt > 0 THEN
    IF p_client_cost_stat = 'cash' THEN
      IF v_client_cash < (p_client_cost_amt + v_cost2_amt) THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
      END IF;
    ELSE
      IF v_client_cash < v_cost2_amt THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
      END IF;
    END IF;
  ELSIF p_client_cost2_stat = 'activity' AND v_cost2_amt > 0 THEN
    IF p_client_cost_stat = 'activity' THEN
      IF v_client_activity < (p_client_cost_amt + v_cost2_amt) THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_activity');
      END IF;
    ELSE
      IF v_client_activity < v_cost2_amt THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_activity');
      END IF;
    END IF;
  END IF;

  -- Provider check (skip for system transactions)
  IF NOT v_is_system THEN
    SELECT activity INTO v_prov_activity
      FROM public.profiles WHERE id = v_owner_id FOR UPDATE;

    IF p_provider_activity_cost > 0 THEN
      IF v_prov_activity < p_provider_activity_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'provider_insufficient_activity');
      END IF;
    END IF;

    -- [Buff] Apply career buff to service income (e.g., 'business' career gives +15%)
    v_actual_prov_cash_share := FLOOR(v_actual_prov_cash_share * (1.0 + public.get_career_buff(v_owner_id, 'service_income_bonus')));
  END IF;

  -- Apply client primary cost
  IF p_client_cost_stat = 'cash' THEN
    UPDATE public.profiles SET cash     = cash     - p_client_cost_amt WHERE id = v_client_id;
  ELSE
    UPDATE public.profiles SET activity = activity - p_client_cost_amt WHERE id = v_client_id;
  END IF;

  -- Apply client secondary cost
  IF p_client_cost2_stat = 'cash' AND v_cost2_amt > 0 THEN
    UPDATE public.profiles SET cash     = cash     - v_cost2_amt WHERE id = v_client_id;
  ELSIF p_client_cost2_stat = 'activity' AND v_cost2_amt > 0 THEN
    UPDATE public.profiles SET activity = activity - v_cost2_amt WHERE id = v_client_id;
  END IF;

  -- Apply client gain
  IF p_client_gain_stat = 'power' THEN
    UPDATE public.profiles SET power = power + p_client_gain_amt WHERE id = v_client_id;
  ELSE
    UPDATE public.profiles SET cash  = cash  + p_client_gain_amt WHERE id = v_client_id;
  END IF;

  -- Apply provider gains / costs (skip for system transactions)
  IF NOT v_is_system THEN
    IF p_provider_activity_cost > 0 THEN
      UPDATE public.profiles SET activity   = activity   - p_provider_activity_cost WHERE id = v_owner_id;
    END IF;
    IF v_actual_prov_cash_share > 0 THEN
      UPDATE public.profiles SET cash       = cash       + v_actual_prov_cash_share     WHERE id = v_owner_id;
    END IF;
    IF p_provider_power_gain > 0 THEN
      UPDATE public.profiles SET power      = power      + p_provider_power_gain     WHERE id = v_owner_id;
    END IF;
    IF p_provider_popularity_gain > 0 THEN
      UPDATE public.profiles SET popularity = popularity + p_provider_popularity_gain WHERE id = v_owner_id;
    END IF;
  END IF;

  -- Log transaction (extended)
  INSERT INTO public.service_transactions (
    business_asset_id, provider_id, client_id, institution_type,
    client_cost_stat,   client_cost_amount,
    client_gain_stat,   client_gain_amount,
    provider_activity_spent, provider_cash_earned,
    provider_power_earned,   provider_popularity_earned
  ) VALUES (
    CASE WHEN v_is_system THEN NULL ELSE p_asset_id END,
    v_owner_id, v_client_id, p_institution_type,
    p_client_cost_stat,  p_client_cost_amt,
    p_client_gain_stat,  p_client_gain_amt,
    p_provider_activity_cost, v_actual_prov_cash_share,
    p_provider_power_gain,    p_provider_popularity_gain
  );

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_client_id, 'service_used', jsonb_build_object(
    'asset_id',           CASE WHEN v_is_system THEN NULL ELSE p_asset_id END,
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
    'providerCashEarned',       v_actual_prov_cash_share,
    'providerPowerEarned',      p_provider_power_gain,
    'providerPopularityEarned', p_provider_popularity_gain
  );
END;
$$;


CREATE OR REPLACE FUNCTION public.buy_asset_listing(p_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id UUID := auth.uid();
  v_asset_id UUID;
  v_seller_id UUID;
  v_price BIGINT;
  v_buyer_cash BIGINT;
  
  v_tax_rate NUMERIC := 0.05; -- Base 5% tax on sales
  v_tax_amount BIGINT;
  v_seller_receives BIGINT;
BEGIN
  IF v_buyer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT asset_id, seller_id, price
    INTO v_asset_id, v_seller_id, v_price
    FROM public.asset_listings
   WHERE id = p_listing_id AND status = 'active'
   FOR UPDATE;

  IF v_asset_id IS NULL OR v_seller_id = v_buyer_id THEN
    RETURN FALSE;
  END IF;

  PERFORM 1 FROM public.assets
   WHERE id = v_asset_id AND owner_id = v_seller_id AND is_for_sale = TRUE
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT cash INTO v_buyer_cash FROM public.profiles
   WHERE id = v_buyer_id FOR UPDATE;
  IF v_buyer_cash IS NULL OR v_buyer_cash < v_price THEN
    RETURN FALSE;
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = v_seller_id FOR UPDATE;

  -- [Buff] Apply career buff to market tax (e.g., 'trader' career reduces tax)
  v_tax_rate := 0.05 * (1.0 - GREATEST(
    public.get_career_buff(v_seller_id, 'market_tax_discount'),
    public.get_career_buff(v_buyer_id, 'market_tax_discount')
  ));

  v_tax_amount := FLOOR(v_price * v_tax_rate);
  v_seller_receives := v_price - v_tax_amount;

  UPDATE public.profiles SET cash = cash - v_price WHERE id = v_buyer_id;
  UPDATE public.profiles SET cash = cash + v_seller_receives WHERE id = v_seller_id;
  UPDATE public.assets
     SET owner_id = v_buyer_id, is_for_sale = FALSE, ask_price = NULL
   WHERE id = v_asset_id;
  UPDATE public.asset_listings
     SET status = 'sold', buyer_id = v_buyer_id, sold_at = NOW()
   WHERE id = p_listing_id;
  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_buyer_id, 'market_purchase', jsonb_build_object('listing_id', p_listing_id, 'price', v_price, 'tax', v_tax_amount));
  
  -- Also log sale event for seller
  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_seller_id, 'market_sale', jsonb_build_object('listing_id', p_listing_id, 'price', v_price, 'tax', v_tax_amount, 'received', v_seller_receives));

  RETURN TRUE;
END;
$$;
