-- ============================================================
--  BuildIran — NPC Workers System Migration
--  Run AFTER:
--    1. "Supabase Schema.sql"
--    2. "economy_migration.sql"
--    3. "build_modes_v1_migration.sql"
--
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. New columns on profiles ───────────────────────────────────────────────
-- active_npc_count: cached count of NPCs actively working (maintained by trigger)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_npc_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.active_npc_count IS
  'Cached count of NPCs currently is_working=TRUE owned by this player. Maintained by trigger.';

-- ─── 2. New columns on assets ─────────────────────────────────────────────────
-- max_capacity:          for resident_house — max NPC slots (computed at build time)
-- floor_count:           number of floors (applies to main_house and resident_house)
-- area_m2:               plot area in m² (50=small / 100=medium / 200=large)
-- current_worker_count:  cached count of NPCs currently assigned to this business

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS max_capacity         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS floor_count          INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS area_m2              INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS current_worker_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.assets.max_capacity IS
  'For resident_house: max NPC residents. Formula: floor(tier^2 * area_factor * floor_factor).';
COMMENT ON COLUMN public.assets.floor_count IS
  'Number of floors. Increases build cost and capacity for housing types.';
COMMENT ON COLUMN public.assets.area_m2 IS
  'Plot area in m². Values: 50 (small/1x), 100 (medium/1.5x), 200 (large/2x).';
COMMENT ON COLUMN public.assets.current_worker_count IS
  'For business assets: cached count of assigned+working NPCs.';

-- ─── 3. NPC Classes lookup ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.npc_classes (
  code                    TEXT PRIMARY KEY,
  name_fa                 TEXT NOT NULL,
  base_hiring_cost        INTEGER NOT NULL DEFAULT 500,
  max_level               INTEGER NOT NULL DEFAULT 10,
  activity_contribution   NUMERIC(4,2) NOT NULL DEFAULT 1.0
);

COMMENT ON TABLE public.npc_classes IS 'Static lookup of NPC class definitions.';

INSERT INTO public.npc_classes (code, name_fa, base_hiring_cost, max_level, activity_contribution)
VALUES
  ('worker',     'کارگر',    500,   10, 1.0),
  ('foreman',    'سرکارگر',  1500,  10, 1.5),
  ('engineer',   'مهندس',    2500,  10, 2.0),
  ('doctor',     'پزشک',     4000,  10, 2.5),
  ('specialist', 'متخصص',   3000,  10, 2.0),
  ('physician',  'طبیب',     5000,  10, 3.0)
ON CONFLICT (code) DO NOTHING;

-- ─── 4. NPCs table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.npcs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name_fa                   TEXT NOT NULL,
  class                     TEXT NOT NULL REFERENCES public.npc_classes(code),
  level                     INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
  experience                INTEGER NOT NULL DEFAULT 0,
  specialties               TEXT[] NOT NULL DEFAULT '{}',
  current_business_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  home_asset_id             UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  is_working                BOOLEAN NOT NULL DEFAULT FALSE,
  hired_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_worked_at            TIMESTAMPTZ
);

COMMENT ON TABLE public.npcs IS
  'NPC workers owned by players. Each NPC can be assigned to one business at a time.';

CREATE INDEX IF NOT EXISTS idx_npcs_owner      ON public.npcs(owner_id);
CREATE INDEX IF NOT EXISTS idx_npcs_business   ON public.npcs(current_business_asset_id);
CREATE INDEX IF NOT EXISTS idx_npcs_working    ON public.npcs(is_working) WHERE is_working = TRUE;

-- ─── 5. NPC Assignments table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.npc_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id            UUID NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  business_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  requester_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','revoked')),
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.npc_assignments IS
  'Cross-player NPC assignment requests with approval workflow.';

CREATE INDEX IF NOT EXISTS idx_npc_assign_npc     ON public.npc_assignments(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_assign_biz     ON public.npc_assignments(business_asset_id);
CREATE INDEX IF NOT EXISTS idx_npc_assign_req     ON public.npc_assignments(requester_id);
CREATE INDEX IF NOT EXISTS idx_npc_assign_owner   ON public.npc_assignments(business_owner_id);
CREATE INDEX IF NOT EXISTS idx_npc_assign_pending ON public.npc_assignments(status) WHERE status = 'pending';

-- ─── 6. NPC Training Sessions table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.npc_training_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id               UUID NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  institution_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  institution_type     TEXT NOT NULL,
  xp_gained            INTEGER NOT NULL DEFAULT 0,
  specialty_learned    TEXT,
  cash_cost            INTEGER NOT NULL DEFAULT 0,
  started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_npc   ON public.npc_training_sessions(npc_id);
CREATE INDEX IF NOT EXISTS idx_training_asset ON public.npc_training_sessions(institution_asset_id);

-- ─── 7. Helper: Compute Resident House Capacity ───────────────────────────────
-- Formula: floor( tier^2 * area_factor * floor_factor )
--   area_factor:  50m²→1.0, 100m²→1.5, 200m²→2.0
--   floor_factor: 1 + (floor_count - 1) * 0.5
-- e.g. tier=2, area=100m², floors=3 → floor(4 * 1.5 * 2.0) = 12

CREATE OR REPLACE FUNCTION public.compute_resident_house_capacity(
  p_tier        INTEGER,
  p_area_m2     INTEGER,
  p_floor_count INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_area_factor  NUMERIC;
  v_floor_factor NUMERIC;
BEGIN
  v_area_factor := CASE
    WHEN p_area_m2 <= 50  THEN 1.0
    WHEN p_area_m2 <= 100 THEN 1.5
    ELSE 2.0
  END;
  v_floor_factor := 1.0 + (p_floor_count - 1) * 0.5;
  RETURN GREATEST(1, FLOOR((p_tier ^ 2) * v_area_factor * v_floor_factor))::INTEGER;
END;
$$;

-- ─── 8. Helper: Compute Housing Build Cost ────────────────────────────────────
-- base_cost * area_factor * floor_multiplier
-- main_house base=1500, resident_house base=2000

CREATE OR REPLACE FUNCTION public.compute_housing_cost(
  p_type        TEXT,
  p_area_m2     INTEGER,
  p_floor_count INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base        INTEGER;
  v_area_factor NUMERIC;
  v_floor_mul   NUMERIC;
BEGIN
  v_base := CASE p_type WHEN 'main_house' THEN 1500 ELSE 2000 END;
  v_area_factor := CASE
    WHEN p_area_m2 <= 50  THEN 1.0
    WHEN p_area_m2 <= 100 THEN 1.5
    ELSE 2.0
  END;
  v_floor_mul := 1.0 + (p_floor_count - 1) * 0.4;
  RETURN FLOOR(v_base * v_area_factor * v_floor_mul)::INTEGER;
END;
$$;

-- ─── 9. RPC: Hire NPC ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hire_npc(
  p_class         TEXT,
  p_name_fa       TEXT,
  p_home_asset_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id   UUID := auth.uid();
  v_hiring_cost INTEGER;
  v_cash        BIGINT;
  v_has_main    BOOLEAN;
  v_home_valid  BOOLEAN;
  v_home_cap    INTEGER;
  v_residents   INTEGER;
  v_npc_id      UUID;
BEGIN
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Must own a main_house
  SELECT EXISTS (
    SELECT 1 FROM public.assets WHERE owner_id = v_player_id AND type = 'main_house'
  ) INTO v_has_main;
  IF NOT v_has_main THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_main_house');
  END IF;

  -- Validate class and get hiring cost
  SELECT base_hiring_cost INTO v_hiring_cost
    FROM public.npc_classes WHERE code = p_class;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_class');
  END IF;

  -- Validate home asset (must be a resident_house owned by player with free capacity)
  IF p_home_asset_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.assets
       WHERE id = p_home_asset_id AND owner_id = v_player_id AND type = 'resident_house'
    ) INTO v_home_valid;
    IF NOT v_home_valid THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_home_asset');
    END IF;

    SELECT max_capacity INTO v_home_cap FROM public.assets WHERE id = p_home_asset_id;
    SELECT COUNT(*) INTO v_residents FROM public.npcs WHERE home_asset_id = p_home_asset_id;
    IF v_residents >= v_home_cap THEN
      RETURN jsonb_build_object('success', false, 'error', 'home_at_capacity');
    END IF;
  END IF;

  -- Check and deduct cash
  SELECT cash INTO v_cash FROM public.profiles WHERE id = v_player_id FOR UPDATE;
  IF v_cash < v_hiring_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;
  UPDATE public.profiles SET cash = cash - v_hiring_cost WHERE id = v_player_id;

  -- Insert NPC
  INSERT INTO public.npcs (owner_id, name_fa, class, home_asset_id)
  VALUES (v_player_id, p_name_fa, p_class, p_home_asset_id)
  RETURNING id INTO v_npc_id;

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_player_id, 'npc_hired', jsonb_build_object(
    'npc_id', v_npc_id, 'class', p_class, 'cost', v_hiring_cost
  ));

  RETURN jsonb_build_object('success', true, 'npc_id', v_npc_id, 'cash_spent', v_hiring_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION public.hire_npc(TEXT, TEXT, UUID) TO authenticated;

-- ─── 10. RPC: Assign NPC to Business ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.assign_npc_to_business(
  p_npc_id            UUID,
  p_business_asset_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    UUID := auth.uid();
  v_npc_owner_id UUID;
  v_npc_working  BOOLEAN;
  v_biz_owner_id UUID;
  v_status       TEXT;
  v_assignment_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT owner_id, is_working INTO v_npc_owner_id, v_npc_working
    FROM public.npcs WHERE id = p_npc_id FOR UPDATE;
  IF v_npc_owner_id IS NULL OR v_npc_owner_id <> v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'npc_not_owned');
  END IF;
  IF v_npc_working THEN
    RETURN jsonb_build_object('success', false, 'error', 'npc_already_working');
  END IF;

  SELECT owner_id INTO v_biz_owner_id FROM public.assets WHERE id = p_business_asset_id;
  IF v_biz_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'business_not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.npc_assignments
     WHERE npc_id = p_npc_id AND business_asset_id = p_business_asset_id AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'request_already_pending');
  END IF;

  -- Same owner = auto-approve
  IF v_biz_owner_id = v_caller_id THEN
    v_status := 'approved';
    UPDATE public.npcs
       SET is_working = TRUE, current_business_asset_id = p_business_asset_id, last_worked_at = NOW()
     WHERE id = p_npc_id;
    UPDATE public.assets SET current_worker_count = current_worker_count + 1
     WHERE id = p_business_asset_id;
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO public.npc_assignments
    (npc_id, business_asset_id, requester_id, business_owner_id, status, responded_at)
  VALUES
    (p_npc_id, p_business_asset_id, v_caller_id, v_biz_owner_id, v_status,
     CASE WHEN v_status = 'approved' THEN NOW() ELSE NULL END)
  RETURNING id INTO v_assignment_id;

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_caller_id, 'npc_assigned', jsonb_build_object(
    'npc_id', p_npc_id, 'business_asset_id', p_business_asset_id,
    'auto_approved', (v_biz_owner_id = v_caller_id)
  ));

  RETURN jsonb_build_object('success', true, 'assignment_id', v_assignment_id, 'status', v_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_npc_to_business(UUID, UUID) TO authenticated;

-- ─── 11. RPC: Respond to NPC Assignment Request ───────────────────────────────

CREATE OR REPLACE FUNCTION public.respond_to_npc_request(
  p_assignment_id UUID,
  p_accept        BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   UUID := auth.uid();
  v_npc_id      UUID;
  v_biz_id      UUID;
  v_biz_owner   UUID;
  v_new_status  TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT npc_id, business_asset_id, business_owner_id
    INTO v_npc_id, v_biz_id, v_biz_owner
    FROM public.npc_assignments
   WHERE id = p_assignment_id AND status = 'pending'
   FOR UPDATE;

  IF v_biz_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found_or_not_pending');
  END IF;
  IF v_biz_owner <> v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_business_owner');
  END IF;

  v_new_status := CASE WHEN p_accept THEN 'approved' ELSE 'rejected' END;

  UPDATE public.npc_assignments
     SET status = v_new_status, responded_at = NOW()
   WHERE id = p_assignment_id;

  IF p_accept THEN
    UPDATE public.npcs
       SET is_working = TRUE, current_business_asset_id = v_biz_id, last_worked_at = NOW()
     WHERE id = v_npc_id;
    UPDATE public.assets SET current_worker_count = current_worker_count + 1
     WHERE id = v_biz_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'status', v_new_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_npc_request(UUID, BOOLEAN) TO authenticated;

-- ─── 12. RPC: Revoke NPC Assignment ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.revoke_npc_assignment(
  p_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id  UUID := auth.uid();
  v_npc_id     UUID;
  v_biz_id     UUID;
  v_requester  UUID;
  v_biz_owner  UUID;
  v_status     TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT npc_id, business_asset_id, requester_id, business_owner_id, status
    INTO v_npc_id, v_biz_id, v_requester, v_biz_owner, v_status
    FROM public.npc_assignments
   WHERE id = p_assignment_id
   FOR UPDATE;

  IF v_npc_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  IF v_caller_id <> v_requester AND v_caller_id <> v_biz_owner THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  IF v_status NOT IN ('pending', 'approved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_revoke');
  END IF;

  UPDATE public.npc_assignments SET status = 'revoked', responded_at = NOW()
   WHERE id = p_assignment_id;

  IF v_status = 'approved' THEN
    UPDATE public.npcs SET is_working = FALSE, current_business_asset_id = NULL
     WHERE id = v_npc_id;
    UPDATE public.assets SET current_worker_count = GREATEST(0, current_worker_count - 1)
     WHERE id = v_biz_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_npc_assignment(UUID) TO authenticated;

-- ─── 13. RPC: Train NPC at Institution ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.train_npc(
  p_npc_id               UUID,
  p_institution_asset_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    UUID := auth.uid();
  v_npc_owner    UUID;
  v_npc_level    INTEGER;
  v_npc_xp       INTEGER;
  v_npc_specs    TEXT[];
  v_inst_type    TEXT;
  v_inst_owner   UUID;
  v_xp_gain      INTEGER;
  v_cash_cost    INTEGER;
  v_player_cash  BIGINT;
  v_specialty    TEXT;
  v_new_xp       INTEGER;
  v_new_level    INTEGER;
  v_leveled_up   BOOLEAN := FALSE;
  v_xp_table     INTEGER[] := ARRAY[100,300,600,1200,2500,5000,10000,20000,50000,100000];
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT owner_id, level, experience, specialties
    INTO v_npc_owner, v_npc_level, v_npc_xp, v_npc_specs
    FROM public.npcs WHERE id = p_npc_id FOR UPDATE;
  IF v_npc_owner <> v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'npc_not_owned');
  END IF;
  IF v_npc_level >= 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'max_level_reached');
  END IF;

  SELECT institution_type, owner_id INTO v_inst_type, v_inst_owner
    FROM public.assets WHERE id = p_institution_asset_id;
  IF v_inst_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_an_institution');
  END IF;

  -- XP and cost per institution type
  CASE v_inst_type
    WHEN 'gym'          THEN v_xp_gain := 80;  v_cash_cost := 200; v_specialty := 'قدرت بدنی';
    WHEN 'university'   THEN v_xp_gain := 150; v_cash_cost := 400; v_specialty := 'دانش فنی';
    WHEN 'hospital'     THEN v_xp_gain := 120; v_cash_cost := 500; v_specialty := 'مهارت پزشکی';
    WHEN 'bank_service' THEN v_xp_gain := 100; v_cash_cost := 300; v_specialty := 'مدیریت مالی';
    WHEN 'cafe'         THEN v_xp_gain := 40;  v_cash_cost := 100; v_specialty := NULL;
    WHEN 'park_service' THEN v_xp_gain := 50;  v_cash_cost := 80;  v_specialty := NULL;
    WHEN 'restaurant'   THEN v_xp_gain := 60;  v_cash_cost := 150; v_specialty := 'آشپزی حرفه‌ای';
    WHEN 'shopping'     THEN v_xp_gain := 50;  v_cash_cost := 120; v_specialty := 'بازاریابی';
    ELSE                     v_xp_gain := 30;  v_cash_cost := 100; v_specialty := NULL;
  END CASE;

  SELECT cash INTO v_player_cash FROM public.profiles WHERE id = v_caller_id FOR UPDATE;
  IF v_player_cash < v_cash_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;

  UPDATE public.profiles SET cash = cash - v_cash_cost WHERE id = v_caller_id;

  -- Pay institution owner 30%
  IF v_inst_owner IS NOT NULL AND v_inst_owner <> v_caller_id THEN
    UPDATE public.profiles
       SET cash = cash + FLOOR(v_cash_cost * 0.30)
     WHERE id = v_inst_owner;
  END IF;

  -- Compute level-up
  v_new_xp    := v_npc_xp + v_xp_gain;
  v_new_level := v_npc_level;
  WHILE v_new_level < 10 AND v_new_xp >= v_xp_table[v_new_level] LOOP
    v_new_level  := v_new_level + 1;
    v_leveled_up := TRUE;
  END LOOP;

  -- Specialty award: 40% chance if not already owned
  IF v_specialty IS NOT NULL AND NOT (v_specialty = ANY(v_npc_specs)) AND random() < 0.4 THEN
    v_npc_specs := array_append(v_npc_specs, v_specialty);
  ELSE
    v_specialty := NULL;
  END IF;

  UPDATE public.npcs
     SET experience = v_new_xp, level = v_new_level, specialties = v_npc_specs
   WHERE id = p_npc_id;

  INSERT INTO public.npc_training_sessions
    (npc_id, institution_asset_id, institution_type, xp_gained, specialty_learned, cash_cost)
  VALUES
    (p_npc_id, p_institution_asset_id, v_inst_type, v_xp_gain, v_specialty, v_cash_cost);

  UPDATE public.profiles
     SET activity = activity + CASE WHEN v_leveled_up THEN 10 ELSE 3 END
   WHERE id = v_caller_id;

  INSERT INTO public.game_events (player_id, type, payload)
  VALUES (v_caller_id, 'npc_trained', jsonb_build_object(
    'npc_id', p_npc_id, 'xp_gained', v_xp_gain,
    'new_level', v_new_level, 'leveled_up', v_leveled_up,
    'specialty_learned', v_specialty
  ));

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', v_xp_gain,
    'new_xp', v_new_xp,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'specialty_learned', v_specialty,
    'cash_spent', v_cash_cost
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.train_npc(UUID, UUID) TO authenticated;

-- ─── 14. RPC: Finalize Housing Build ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.finalize_housing_build(
  p_asset_id    UUID,
  p_type        TEXT,
  p_area_m2     INTEGER,
  p_floor_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   UUID := auth.uid();
  v_owner_id    UUID;
  v_cost        INTEGER;
  v_player_cash BIGINT;
  v_capacity    INTEGER;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT owner_id INTO v_owner_id FROM public.assets WHERE id = p_asset_id;
  IF v_owner_id IS NULL OR v_owner_id <> v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_owner');
  END IF;

  IF p_type = 'resident_house' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.assets WHERE owner_id = v_caller_id AND type = 'main_house'
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'no_main_house');
    END IF;
  END IF;

  v_cost := public.compute_housing_cost(p_type, p_area_m2, p_floor_count);

  SELECT cash INTO v_player_cash FROM public.profiles WHERE id = v_caller_id FOR UPDATE;
  IF v_player_cash < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
  END IF;

  v_capacity := CASE
    WHEN p_type = 'resident_house'
    THEN public.compute_resident_house_capacity(1, p_area_m2, p_floor_count)
    ELSE 0
  END;

  UPDATE public.profiles SET cash = cash - v_cost WHERE id = v_caller_id;
  UPDATE public.assets
     SET area_m2       = p_area_m2,
         floor_count   = p_floor_count,
         max_capacity  = v_capacity,
         market_value  = v_cost + FLOOR(v_cost * 0.3)
   WHERE id = p_asset_id;

  RETURN jsonb_build_object(
    'success', true, 'cash_spent', v_cost, 'max_capacity', v_capacity
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_housing_build(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- ─── 15. Trigger: Sync active_npc_count on profiles ──────────────────────────

CREATE OR REPLACE FUNCTION public.sync_active_npc_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_count INTEGER;
BEGIN
  v_owner := COALESCE(NEW.owner_id, OLD.owner_id);
  SELECT COUNT(*) INTO v_count
    FROM public.npcs WHERE owner_id = v_owner AND is_working = TRUE;
  UPDATE public.profiles SET active_npc_count = v_count WHERE id = v_owner;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_active_npc_count ON public.npcs;
CREATE TRIGGER trg_sync_active_npc_count
  AFTER INSERT OR UPDATE OF is_working OR DELETE ON public.npcs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_active_npc_count();

-- ─── 16. pg_cron: Offline Activity Tick (every 5 minutes) ────────────────────
-- Adds activity proportional to class activity_contribution per working NPC.
-- 0.5 multiplier because cron fires every 5 min (12× per hour ≈ 6 units/hr per NPC).

CREATE OR REPLACE FUNCTION public.tick_npc_activity()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
     SET activity = p.activity + subq.earned
    FROM (
      SELECT n.owner_id,
             GREATEST(1, FLOOR(SUM(nc.activity_contribution) * 0.5))::INTEGER AS earned
        FROM public.npcs n
        JOIN public.npc_classes nc ON nc.code = n.class
       WHERE n.is_working = TRUE
       GROUP BY n.owner_id
    ) AS subq
   WHERE p.id = subq.owner_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- IMPORTANT: Run this ONCE in Supabase SQL Editor after
-- enabling pg_cron extension (Dashboard → Database → Extensions):
--
-- SELECT cron.schedule(
--   'npc-activity-tick',
--   '*/5 * * * *',
--   'SELECT public.tick_npc_activity()'
-- );
-- ═══════════════════════════════════════════════════════════

-- ─── 17. Row Level Security ───────────────────────────────────────────────────

ALTER TABLE public.npcs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_classes           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "npc_classes_select_all" ON public.npc_classes;
CREATE POLICY "npc_classes_select_all" ON public.npc_classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "npcs_select_all"   ON public.npcs;
CREATE POLICY "npcs_select_all"   ON public.npcs FOR SELECT USING (true);
DROP POLICY IF EXISTS "npcs_insert_own"   ON public.npcs;
CREATE POLICY "npcs_insert_own"   ON public.npcs FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "npcs_update_own"   ON public.npcs;
CREATE POLICY "npcs_update_own"   ON public.npcs FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "npcs_delete_own"   ON public.npcs;
CREATE POLICY "npcs_delete_own"   ON public.npcs FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "assignments_select" ON public.npc_assignments;
CREATE POLICY "assignments_select" ON public.npc_assignments
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = business_owner_id);
DROP POLICY IF EXISTS "assignments_insert" ON public.npc_assignments;
CREATE POLICY "assignments_insert" ON public.npc_assignments
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
DROP POLICY IF EXISTS "assignments_update" ON public.npc_assignments;
CREATE POLICY "assignments_update" ON public.npc_assignments
  FOR UPDATE USING (auth.uid() = business_owner_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "training_select" ON public.npc_training_sessions;
CREATE POLICY "training_select" ON public.npc_training_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.npcs WHERE id = npc_id AND owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "training_insert" ON public.npc_training_sessions;
CREATE POLICY "training_insert" ON public.npc_training_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.npcs WHERE id = npc_id AND owner_id = auth.uid())
  );

-- ─── 18. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_assets_main_house
  ON public.assets(owner_id) WHERE type = 'main_house';
CREATE INDEX IF NOT EXISTS idx_assets_resident_house
  ON public.assets(owner_id) WHERE type = 'resident_house';
CREATE INDEX IF NOT EXISTS idx_profiles_active_npc
  ON public.profiles(active_npc_count) WHERE active_npc_count > 0;
