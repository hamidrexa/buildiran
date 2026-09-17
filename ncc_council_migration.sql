-- ============================================================
-- BuildIran — NCC Council and Neighborhood Area Migration
-- ============================================================

-- 1. Alter neighborhoods table
ALTER TABLE public.neighborhoods
  ADD COLUMN IF NOT EXISTS area_sqkm DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS council_member_capacity INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_council_popularity INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS council_chair_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_chair_selection_at TIMESTAMPTZ;

-- 2. Create neighborhood_council_members table
CREATE TABLE IF NOT EXISTS public.neighborhood_council_members (
  neighborhood_id TEXT NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (neighborhood_id, player_id)
);

COMMENT ON TABLE public.neighborhood_council_members IS 'Players serving as council members in a neighborhood.';

-- 3. Row Level Security for neighborhood_council_members
ALTER TABLE public.neighborhood_council_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "council_members_select_all" ON public.neighborhood_council_members;
CREATE POLICY "council_members_select_all" ON public.neighborhood_council_members FOR SELECT USING (true);

-- No direct insert/update policies needed as it will be managed via RPCs

-- 4. RPC: request_council_membership
CREATE OR REPLACE FUNCTION public.request_council_membership(p_neighborhood_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID := auth.uid();
  v_cash BIGINT;
  v_popularity INTEGER;
  v_power INTEGER;
  v_min_popularity INTEGER;
  v_capacity INTEGER;
  v_cost BIGINT := 50000; -- Application fee
  v_has_home BOOLEAN;
  v_member_count INTEGER;
  v_lowest_power_member_id UUID;
  v_lowest_power INTEGER;
  v_member_record RECORD;
BEGIN
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  -- Get player stats
  SELECT cash, popularity, power INTO v_cash, v_popularity, v_power
  FROM public.profiles
  WHERE id = v_player_id FOR UPDATE;

  IF v_cash < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  -- Get neighborhood details
  SELECT min_council_popularity, council_member_capacity
  INTO v_min_popularity, v_capacity
  FROM public.neighborhoods
  WHERE id = p_neighborhood_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'neighborhood_not_found');
  END IF;

  -- Deduct cost immediately
  UPDATE public.profiles SET cash = cash - v_cost WHERE id = v_player_id;

  -- CLEANUP PHASE: Remove members who no longer own a home in this neighborhood
  FOR v_member_record IN
    SELECT player_id FROM public.neighborhood_council_members WHERE neighborhood_id = p_neighborhood_id
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.assets
      WHERE owner_id = v_member_record.player_id
        AND neighborhood_id = p_neighborhood_id
        AND type IN ('house', 'villa', 'main_house', 'resident_house')
    ) INTO v_has_home;

    IF NOT v_has_home THEN
      DELETE FROM public.neighborhood_council_members 
      WHERE neighborhood_id = p_neighborhood_id AND player_id = v_member_record.player_id;
    END IF;
  END LOOP;

  -- Check applicant eligibility
  IF v_popularity < v_min_popularity THEN
    RETURN jsonb_build_object('success', false, 'error', 'low_popularity');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.assets
    WHERE owner_id = v_player_id
      AND neighborhood_id = p_neighborhood_id
      AND type IN ('house', 'villa', 'main_house', 'resident_house')
  ) INTO v_has_home;

  IF NOT v_has_home THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_home');
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.neighborhood_council_members
    WHERE neighborhood_id = p_neighborhood_id AND player_id = v_player_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_member');
  END IF;

  -- EVALUATION PHASE
  SELECT COUNT(*) INTO v_member_count 
  FROM public.neighborhood_council_members 
  WHERE neighborhood_id = p_neighborhood_id;

  IF v_member_count < v_capacity THEN
    -- Add directly if there is space
    INSERT INTO public.neighborhood_council_members (neighborhood_id, player_id)
    VALUES (p_neighborhood_id, v_player_id);
    
    RETURN jsonb_build_object('success', true, 'action', 'added');
  ELSE
    -- Find lowest power member
    SELECT ncm.player_id, p.power INTO v_lowest_power_member_id, v_lowest_power
    FROM public.neighborhood_council_members ncm
    JOIN public.profiles p ON ncm.player_id = p.id
    WHERE ncm.neighborhood_id = p_neighborhood_id
    ORDER BY p.power ASC
    LIMIT 1;

    IF v_power > v_lowest_power THEN
      -- Replace
      DELETE FROM public.neighborhood_council_members 
      WHERE neighborhood_id = p_neighborhood_id AND player_id = v_lowest_power_member_id;
      
      INSERT INTO public.neighborhood_council_members (neighborhood_id, player_id)
      VALUES (p_neighborhood_id, v_player_id);

      -- Check if chairman was removed
      UPDATE public.neighborhoods 
      SET council_chair_id = NULL 
      WHERE id = p_neighborhood_id AND council_chair_id = v_lowest_power_member_id;

      RETURN jsonb_build_object('success', true, 'action', 'replaced', 'replaced_player_id', v_lowest_power_member_id);
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'power_too_low');
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_council_membership(TEXT) TO authenticated;

-- 5. RPC: trigger_chair_selection
CREATE OR REPLACE FUNCTION public.trigger_chair_selection(p_neighborhood_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID := auth.uid();
  v_last_selection TIMESTAMPTZ;
  v_highest_power_member_id UUID;
  v_highest_power INTEGER;
BEGIN
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  -- Must be a council member to trigger
  IF NOT EXISTS (
    SELECT 1 FROM public.neighborhood_council_members
    WHERE neighborhood_id = p_neighborhood_id AND player_id = v_player_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  -- Check cooldown
  SELECT last_chair_selection_at INTO v_last_selection
  FROM public.neighborhoods
  WHERE id = p_neighborhood_id FOR UPDATE;

  IF v_last_selection IS NOT NULL AND NOW() < v_last_selection + INTERVAL '7 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'cooldown_active', 'last_selection', v_last_selection);
  END IF;

  -- Find highest power member
  SELECT ncm.player_id, p.power INTO v_highest_power_member_id, v_highest_power
  FROM public.neighborhood_council_members ncm
  JOIN public.profiles p ON ncm.player_id = p.id
  WHERE ncm.neighborhood_id = p_neighborhood_id
  ORDER BY p.power DESC, ncm.joined_at ASC
  LIMIT 1;

  IF v_highest_power_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_members');
  END IF;

  -- Update chairman and timestamp
  UPDATE public.neighborhoods
  SET council_chair_id = v_highest_power_member_id,
      last_chair_selection_at = NOW()
  WHERE id = p_neighborhood_id;

  RETURN jsonb_build_object('success', true, 'chair_id', v_highest_power_member_id, 'power', v_highest_power);
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_chair_selection(TEXT) TO authenticated;
