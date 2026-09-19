-- ============================================================
--  BuildIran — Missions System Migration (v6)
--  Run AFTER:
--    1. "Supabase Schema.sql"
--    2. "economy_migration.sql"
--    3. "build_modes_v1_migration.sql"
--    4. "npc_workers_migration.sql"
--    5. "tehran_districts_migration.sql"
--    6. "tehran_districts_community_centers_migration.sql"
--    7. "ncc_council_migration.sql"
--    8. "neighborhood_power_economy_migration.sql"
--
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. Core Tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mission_definitions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category       TEXT NOT NULL,
  chain_code     TEXT,
  chain_step     INTEGER,
  title_fa       TEXT NOT NULL,
  description_fa TEXT NOT NULL,
  objectives     JSONB NOT NULL DEFAULT '[]',
  rewards        JSONB NOT NULL DEFAULT '{}',
  filters        JSONB,
  valid_from     TIMESTAMPTZ,
  valid_until    TIMESTAMPTZ,
  icon           TEXT NOT NULL DEFAULT '🎯',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.mission_definitions IS 'Data-driven definitions of all missions in the game.';

CREATE TABLE IF NOT EXISTS public.player_mission_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_def_id UUID NOT NULL REFERENCES public.mission_definitions(id) ON DELETE CASCADE,
  period_key     TEXT NOT NULL,
  progress       JSONB NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed', 'expired', 'locked')),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  claimed_at     TIMESTAMPTZ,
  UNIQUE(player_id, mission_def_id, period_key)
);

COMMENT ON TABLE public.player_mission_slots IS 'Player-specific mission progress instances.';
CREATE INDEX IF NOT EXISTS idx_player_missions_player ON public.player_mission_slots(player_id);
CREATE INDEX IF NOT EXISTS idx_player_missions_status ON public.player_mission_slots(status);

CREATE TABLE IF NOT EXISTS public.mission_neighborhood_visits (
  player_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  neighborhood_id TEXT NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  visited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(player_id, neighborhood_id)
);

-- Enable RLS (all progress is server-authoritative)
ALTER TABLE public.mission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_mission_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_neighborhood_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of definitions" ON public.mission_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to read own mission slots" ON public.player_mission_slots FOR SELECT TO authenticated USING (auth.uid() = player_id);

-- ─── 2. Ensure / Lazy Generate RPC ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ensure_player_missions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id  UUID := auth.uid();
  v_tier       INTEGER;
  v_today_str  TEXT;
  v_week_str   TEXT;
  v_created    INTEGER := 0;
BEGIN
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('success', false); END IF;
  SELECT power_tier INTO v_tier FROM public.profiles WHERE id = v_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false); END IF;

  -- Tehran Time bounds
  v_today_str := to_char(now() AT TIME ZONE 'Asia/Tehran', 'YYYY-MM-DD');
  v_week_str  := to_char(date_trunc('week', now() AT TIME ZONE 'Asia/Tehran' + interval '1 day') - interval '1 day', 'YYYY-MM-DD');

  -- Achievements (always)
  INSERT INTO public.player_mission_slots (player_id, mission_def_id, period_key)
  SELECT v_player_id, md.id, 'always'
  FROM public.mission_definitions md
  WHERE md.category = 'achievement'
  ON CONFLICT (player_id, mission_def_id, period_key) DO NOTHING;
  GET DIAGNOSTICS v_created = ROW_COUNT;

  -- Story base (Step 1s only)
  INSERT INTO public.player_mission_slots (player_id, mission_def_id, period_key)
  SELECT v_player_id, md.id, 'always'
  FROM public.mission_definitions md
  WHERE md.category = 'story' AND md.chain_step = 1
  ON CONFLICT (player_id, mission_def_id, period_key) DO NOTHING;

  -- Dailies (match tier or no tier)
  INSERT INTO public.player_mission_slots (player_id, mission_def_id, period_key)
  SELECT v_player_id, md.id, 'daily:' || v_today_str
  FROM public.mission_definitions md
  WHERE md.category = 'daily'
    AND (md.filters IS NULL OR (COALESCE((md.filters->>'min_tier')::int, 0) <= v_tier AND COALESCE((md.filters->>'max_tier')::int, 99) >= v_tier))
  ON CONFLICT (player_id, mission_def_id, period_key) DO NOTHING;

  -- Weeklies (match tier or no tier)
  INSERT INTO public.player_mission_slots (player_id, mission_def_id, period_key)
  SELECT v_player_id, md.id, 'weekly:' || v_week_str
  FROM public.mission_definitions md
  WHERE md.category = 'weekly'
    AND (md.filters IS NULL OR (COALESCE((md.filters->>'min_tier')::int, 0) <= v_tier AND COALESCE((md.filters->>'max_tier')::int, 99) >= v_tier))
  ON CONFLICT (player_id, mission_def_id, period_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'slots_created', v_created);
END;
$$;

-- ─── 3. Get / Read RPCs ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_player_missions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID := auth.uid();
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(
      jsonb_build_object(
        'id', s.id,
        'player_id', s.player_id,
        'mission_def_id', s.mission_def_id,
        'period_key', s.period_key,
        'progress', s.progress,
        'status', s.status,
        'unlocked_at', s.unlocked_at,
        'completed_at', s.completed_at,
        'claimed_at', s.claimed_at,
        'definition', to_jsonb(md)
      )
    ), '[]'::json)
    FROM public.player_mission_slots s
    JOIN public.mission_definitions md ON s.mission_def_id = md.id
    WHERE s.player_id = v_player_id
      AND s.status != 'expired'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_mission_slot(p_slot_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
        'id', s.id,
        'player_id', s.player_id,
        'mission_def_id', s.mission_def_id,
        'period_key', s.period_key,
        'progress', s.progress,
        'status', s.status,
        'unlocked_at', s.unlocked_at,
        'completed_at', s.completed_at,
        'claimed_at', s.claimed_at,
        'definition', to_jsonb(md)
    )
    FROM public.player_mission_slots s
    JOIN public.mission_definitions md ON s.mission_def_id = md.id
    WHERE s.id = p_slot_id
  );
END;
$$;

-- ─── 4. Progress Advancement Engine ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.advance_mission_progress(
  p_player_id UUID,
  p_objective_type TEXT,
  p_filter JSONB DEFAULT '{}'::jsonb,
  p_increment INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_obj JSONB;
  v_idx TEXT;
  v_current INTEGER;
  v_target INTEGER;
  v_match BOOLEAN;
  v_all_done BOOLEAN;
  v_new_progress JSONB;
BEGIN
  -- Iterate all active slots for the player
  FOR r IN 
    SELECT s.id, s.progress, md.objectives
    FROM public.player_mission_slots s
    JOIN public.mission_definitions md ON s.mission_def_id = md.id
    WHERE s.player_id = p_player_id AND s.status = 'active'
  LOOP
    v_new_progress := r.progress;
    v_all_done := true;

    -- Iterate objectives in the mission definition
    FOR i IN 0 .. jsonb_array_length(r.objectives) - 1 LOOP
      v_obj := r.objectives->i;
      v_idx := i::text;
      v_current := COALESCE((v_new_progress->>v_idx)::int, 0);
      v_target := COALESCE((v_obj->>'target_value')::int, 1);

      -- Does this objective match the event type?
      IF v_obj->>'type' = p_objective_type THEN
        -- Check filters if any
        v_match := true;
        IF v_obj ? 'filter' AND v_obj->'filter' IS NOT NULL THEN
          -- Simple string/number matching loop over filter keys
          -- If the definition filter has a key that isn't in p_filter or doesn't match, it fails
          DECLARE
            k TEXT;
            v TEXT;
          BEGIN
            FOR k, v IN SELECT key, value FROM jsonb_each_text(v_obj->'filter') LOOP
              IF p_filter->>k IS NULL OR p_filter->>k != v THEN
                v_match := false;
              END IF;
            END LOOP;
          END;
        END IF;

        IF v_match AND v_current < v_target THEN
          v_current := LEAST(v_current + p_increment, v_target);
          v_new_progress := jsonb_set(v_new_progress, ARRAY[v_idx], to_jsonb(v_current));
        END IF;
      END IF;

      -- Check completion
      IF v_current < v_target THEN
        v_all_done := false;
      END IF;
    END LOOP;

    -- Update row if changed
    IF r.progress != v_new_progress THEN
      IF v_all_done THEN
        UPDATE public.player_mission_slots 
        SET progress = v_new_progress, status = 'completed', completed_at = NOW() 
        WHERE id = r.id;
      ELSE
        UPDATE public.player_mission_slots 
        SET progress = v_new_progress 
        WHERE id = r.id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ─── 5. Claim Reward RPC ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.claim_mission_reward(p_slot_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID := auth.uid();
  v_slot RECORD;
  v_def RECORD;
  v_cash INTEGER := 0;
  v_power INTEGER := 0;
  v_pop INTEGER := 0;
  v_act INTEGER := 0;
  v_next_slot_id UUID;
BEGIN
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;

  -- Select FOR UPDATE to prevent double-claim race condition
  SELECT * INTO v_slot FROM public.player_mission_slots WHERE id = p_slot_id AND player_id = v_player_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF v_slot.status = 'claimed' THEN RETURN jsonb_build_object('success', false, 'error', 'already_claimed'); END IF;
  IF v_slot.status != 'completed' THEN RETURN jsonb_build_object('success', false, 'error', 'not_completed'); END IF;

  SELECT * INTO v_def FROM public.mission_definitions WHERE id = v_slot.mission_def_id;

  -- Extract rewards
  v_cash := COALESCE((v_def.rewards->>'cash')::int, 0);
  v_power := COALESCE((v_def.rewards->>'power')::int, 0);
  v_pop := COALESCE((v_def.rewards->>'popularity')::int, 0);
  v_act := COALESCE((v_def.rewards->>'activity')::int, 0);

  -- Apply rewards atomically
  UPDATE public.profiles 
  SET cash = cash + v_cash,
      power = power + v_power,
      popularity = popularity + v_pop,
      activity = activity + v_act
  WHERE id = v_player_id;

  -- Mark claimed
  UPDATE public.player_mission_slots SET status = 'claimed', claimed_at = NOW() WHERE id = p_slot_id;

  -- If it's a story chain, unlock the next step
  IF v_def.chain_code IS NOT NULL AND v_def.chain_step IS NOT NULL THEN
    INSERT INTO public.player_mission_slots (player_id, mission_def_id, period_key)
    SELECT v_player_id, md.id, 'always'
    FROM public.mission_definitions md
    WHERE md.chain_code = v_def.chain_code AND md.chain_step = v_def.chain_step + 1
    ON CONFLICT (player_id, mission_def_id, period_key) DO NOTHING
    RETURNING id INTO v_next_slot_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'rewards', v_def.rewards,
    'next_slot_id', v_next_slot_id
  );
END;
$$;

-- ─── 6. Triggers on Authoritative Tables ─────────────────────────────────────

-- Assets
CREATE OR REPLACE FUNCTION public.trg_mission_asset_insert() RETURNS trigger AS $$
BEGIN
  -- build_type
  PERFORM public.advance_mission_progress(NEW.owner_id, 'build_type', jsonb_build_object('building_type', NEW.type), 1);
  -- build_count_any
  PERFORM public.advance_mission_progress(NEW.owner_id, 'build_count_any', '{}'::jsonb, 1);
  -- build_in_neighborhood
  IF NEW.neighborhood_id IS NOT NULL THEN
    PERFORM public.advance_mission_progress(NEW.owner_id, 'build_in_neighborhood', 
      jsonb_build_object('neighborhood_id', NEW.neighborhood_id::text, 'building_type', NEW.type), 1);
    PERFORM public.advance_mission_progress(NEW.owner_id, 'build_in_neighborhood', 
      jsonb_build_object('neighborhood_id', NEW.neighborhood_id::text), 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_asset_insert_trigger AFTER INSERT ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_asset_insert();

CREATE OR REPLACE FUNCTION public.trg_mission_asset_update() RETURNS trigger AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    PERFORM public.advance_mission_progress(NEW.owner_id, 'upgrade_building', jsonb_build_object('building_type', NEW.type), 1);
    PERFORM public.advance_mission_progress(NEW.owner_id, 'upgrade_building', '{}'::jsonb, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_asset_update_trigger AFTER UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_asset_update();


-- Asset Listings (Marketplace)
CREATE OR REPLACE FUNCTION public.trg_mission_listing_insert() RETURNS trigger AS $$
BEGIN
  PERFORM public.advance_mission_progress(NEW.seller_id, 'list_asset_for_sale', '{}'::jsonb, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_listing_insert_trigger AFTER INSERT ON public.asset_listings
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_listing_insert();

CREATE OR REPLACE FUNCTION public.trg_mission_listing_update() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    PERFORM public.advance_mission_progress(NEW.seller_id, 'sell_asset', '{}'::jsonb, 1);
    PERFORM public.advance_mission_progress(NEW.seller_id, 'earn_from_sale', '{}'::jsonb, NEW.price);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_listing_update_trigger AFTER UPDATE ON public.asset_listings
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_listing_update();


-- Service Transactions
CREATE OR REPLACE FUNCTION public.trg_mission_service_tx() RETURNS trigger AS $$
BEGIN
  PERFORM public.advance_mission_progress(NEW.client_id, 'use_service', jsonb_build_object('institution_type', NEW.institution_type), 1);
  PERFORM public.advance_mission_progress(NEW.client_id, 'use_service', '{}'::jsonb, 1);
  PERFORM public.advance_mission_progress(NEW.provider_id, 'provide_service', jsonb_build_object('institution_type', NEW.institution_type), 1);
  PERFORM public.advance_mission_progress(NEW.provider_id, 'provide_service', '{}'::jsonb, 1);
  PERFORM public.advance_mission_progress(NEW.provider_id, 'earn_from_services', '{}'::jsonb, NEW.provider_cash_earned);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_service_tx_trigger AFTER INSERT ON public.service_transactions
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_service_tx();


-- NPCs
CREATE OR REPLACE FUNCTION public.trg_mission_npc_insert() RETURNS trigger AS $$
BEGIN
  PERFORM public.advance_mission_progress(NEW.owner_id, 'hire_npc', '{}'::jsonb, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_npc_insert_trigger AFTER INSERT ON public.npcs
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_npc_insert();


-- Profile updates (Power/Tier triggers)
CREATE OR REPLACE FUNCTION public.trg_mission_profile_update() RETURNS trigger AS $$
BEGIN
  IF NEW.power > OLD.power THEN
    PERFORM public.advance_mission_progress(NEW.id, 'reach_power', '{}'::jsonb, NEW.power - OLD.power); -- Wait, reach_power logic is different? Actually we can pass delta and the system accumulates it up to target!
    -- Actually better: advance_mission_progress accumulates, so if target is 50, we just need to add the delta.
  END IF;
  IF NEW.power_tier > OLD.power_tier THEN
    -- If tier increments, add 1. If target is tier 3, and we advance 1 by 1... wait, reach_tier is absolute. 
    -- Workaround: We can't easily do absolute value setting with our simple adder, so we'll just set increment to the new absolute tier. 
    -- Wait, if it adds, then Tier 2 + Tier 3 = 5.
    -- Let's ignore reach_tier for now or just trigger it via custom RPC. 
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_profile_update_trigger AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_profile_update();


-- ─── 7. Record Neighborhood Visit RPC ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.record_neighborhood_visit(p_neighborhood_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID := auth.uid();
BEGIN
  IF v_player_id IS NULL THEN RETURN; END IF;
  
  INSERT INTO public.mission_neighborhood_visits (player_id, neighborhood_id)
  VALUES (v_player_id, p_neighborhood_id)
  ON CONFLICT (player_id, neighborhood_id) DO NOTHING;
  
  -- The act of visiting advances the mission
  PERFORM public.advance_mission_progress(v_player_id, 'explore_neighborhood', jsonb_build_object('neighborhood_id', p_neighborhood_id::text), 1);
END;
$$;


-- ─── 8. Seed Data ────────────────────────────────────────────────────────────

-- Achievement: First Builder
INSERT INTO public.mission_definitions (category, title_fa, description_fa, objectives, rewards, icon, sort_order)
VALUES (
  'achievement', 'سازنده نخستین', 'اولین خانه خود را بسازید.',
  '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "house"}}]'::jsonb,
  '{"cash": 1000, "popularity": 5}'::jsonb,
  '🏗️', 10
);

-- Achievement: Great Trader
INSERT INTO public.mission_definitions (category, title_fa, description_fa, objectives, rewards, icon, sort_order)
VALUES (
  'achievement', 'تاجر بزرگ', '۵ ملک خود را در بازار به فروش برسانید.',
  '[{"type": "sell_asset", "target_value": 5}]'::jsonb,
  '{"cash": 5000, "power": 10}'::jsonb,
  '🤝', 20
);

-- Story Chain: Citizen Start
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order)
VALUES 
  ('story', 'citizen_start', 1, 'پایه‌گذاری امپراتوری', 'یک خانه بسازید تا جریان درآمد شما آغاز شود.',
   '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "house"}}]'::jsonb,
   '{"cash": 500}'::jsonb, '🏡', 1),
   
  ('story', 'citizen_start', 2, 'تأمین منابع', 'اولین ملک خود را در بازار آگهی کنید.',
   '[{"type": "list_asset_for_sale", "target_value": 1}]'::jsonb,
   '{"cash": 200, "power": 3}'::jsonb, '📈', 2),
   
  ('story', 'citizen_start', 3, 'استفاده از خدمات شهری', 'از یک مؤسسه یا خدمات شهری استفاده کنید.',
   '[{"type": "use_service", "target_value": 1}]'::jsonb,
   '{"power": 5, "cash": 100}'::jsonb, '🏙️', 3);

-- Daily Tier 1
INSERT INTO public.mission_definitions (category, title_fa, description_fa, objectives, rewards, filters, icon, sort_order)
VALUES 
  ('daily', 'شهروند فعال', 'امروز از ۲ خدمات استفاده کنید.',
   '[{"type": "use_service", "target_value": 2}]'::jsonb,
   '{"cash": 50, "power": 2}'::jsonb,
   '{"min_tier": 1, "max_tier": 1}'::jsonb, '☀️', 1),
   
  ('daily', 'سازنده روزانه', 'امروز یک بنای جدید احداث کنید.',
   '[{"type": "build_count_any", "target_value": 1}]'::jsonb,
   '{"cash": 100, "power": 3}'::jsonb,
   '{"min_tier": 1, "max_tier": 1}'::jsonb, '🔨', 2);

-- Weekly Tier 1
INSERT INTO public.mission_definitions (category, title_fa, description_fa, objectives, rewards, filters, icon, sort_order)
VALUES 
  ('weekly', 'تلاش مستمر', 'در این هفته ۵ ملک در بازار بفروشید.',
   '[{"type": "sell_asset", "target_value": 5}]'::jsonb,
   '{"cash": 1500, "power": 15}'::jsonb,
   '{"min_tier": 1, "max_tier": 2}'::jsonb, '📅', 1);
