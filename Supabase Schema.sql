-- ============================================================
--  BuildIran — Supabase SQL Schema (Complete)
--  Run this entire script in the Supabase SQL Editor
--  (Dashboard → SQL Editor → New query → Paste → Run)
-- ============================================================

-- ─── 1. Player Profiles ──────────────────────────────────────
-- Extends auth.users with all game-specific player data.

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  avatar_color    TEXT    DEFAULT '#6C63FF',
  avatar_url      TEXT,
  -- Progression
  level           INTEGER DEFAULT 1,
  experience      INTEGER DEFAULT 0,
  -- Economy
  cash            BIGINT  DEFAULT 5000,   -- liquid currency (spendable)
  -- 4-Factor Scores
  power           INTEGER DEFAULT 10,     -- military / influence strength
  wealth          BIGINT  DEFAULT 0,      -- total asset value (auto-computed)
  activity        INTEGER DEFAULT 0,      -- daily active score (actions today)
  popularity      INTEGER DEFAULT 0,      -- social score (trades, alliances)
  -- Meta
  score           INTEGER DEFAULT 0,
  rank            INTEGER DEFAULT 9999,
  status          TEXT    DEFAULT 'online'
                    CHECK (status IN ('online','offline','in_game')),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Player profiles — one row per auth.users entry.';

-- ─── 2. Neighborhoods (Districts) ───────────────────────────
-- Geographical areas/districts governed by high-power neighborhood editors.

CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id                TEXT PRIMARY KEY,           -- e.g. 'tehran_vanak', 'isfahan_jolfa'
  city              TEXT NOT NULL,              -- e.g. 'تهران', 'اصفهان', 'شیراز'
  name_fa           TEXT NOT NULL,              -- e.g. 'ونک', 'جلفا'
  description_fa    TEXT,
  center_lat        DOUBLE PRECISION NOT NULL,
  center_lng        DOUBLE PRECISION NOT NULL,
  radius_km         DOUBLE PRECISION DEFAULT 5.0,
  min_editor_power  INTEGER DEFAULT 150,        -- minimum player power to qualify as editor
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.neighborhoods IS 'Districts with neighborhood editor governance.';

-- ─── 3. Neighborhood Editors ────────────────────────────────
-- Explicit or earned editor credentials for high-power players in neighborhoods.

CREATE TABLE IF NOT EXISTS public.neighborhood_editors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id TEXT NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at     TIMESTAMPTZ DEFAULT NOW(),
  is_lead_editor  BOOLEAN DEFAULT FALSE,
  UNIQUE(neighborhood_id, player_id)
);

COMMENT ON TABLE public.neighborhood_editors IS 'Designated high-power players serving as neighborhood editors.';

-- ─── 4. Custom Building Types (Player Proposed) ──────────────
-- Players can propose new building types with custom features/settings.
-- Requires review and approval by neighborhood editors before appearing on map.

CREATE TABLE IF NOT EXISTS public.custom_building_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,       -- e.g. 'solar_station', 'luxury_bazaar'
  name_fa         TEXT NOT NULL,              -- e.g. 'نیروگاه خورشیدی محله', 'کافه فناوری'
  description_fa  TEXT NOT NULL,
  neighborhood_id TEXT REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  category        TEXT DEFAULT 'commercial'
                    CHECK (category IN ('residential','commercial','industrial','military','cultural','tech')),
  base_cost       BIGINT NOT NULL DEFAULT 5000,
  power_bonus     INTEGER NOT NULL DEFAULT 10,
  income_rate     BIGINT DEFAULT 150,         -- hourly generation
  icon_name       TEXT DEFAULT 'business',
  emoji           TEXT DEFAULT '🏛️',
  color_primary   TEXT DEFAULT '#6C63FF',
  color_secondary TEXT DEFAULT '#A78BFA',
  -- Custom features & settings defined by the player
  custom_settings JSONB DEFAULT '{}',         -- e.g. {"tax_rebate": 5, "buff": "energy", "range_meters": 500}
  -- Status workflow
  proposed_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

COMMENT ON TABLE public.custom_building_types IS 'Player-proposed custom building types requiring neighborhood editor revision.';

-- ─── 5. Assets (Buildings on the Map) ───────────────────────
-- Every building a player constructs on a map coordinate.
-- Supports built-in types AND approved custom building codes.

CREATE TABLE IF NOT EXISTS public.assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,              -- built-in (house, shop, mall, villa, office, etc.) or custom code
  neighborhood_id TEXT REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  -- Geo location (center of building plot)
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  tile_id      TEXT NOT NULL,              -- grid tile key, e.g. "35.69_51.39_15"
  -- Stats
  level        INTEGER DEFAULT 1,
  market_value BIGINT  DEFAULT 1000,       -- current market value in-game currency
  power_bonus  INTEGER DEFAULT 0,          -- power granted to owner
  -- Marketplace
  is_for_sale  BOOLEAN DEFAULT FALSE,
  ask_price    BIGINT,                     -- listed sale price (nullable when not for sale)
  -- Timestamps
  built_at     TIMESTAMPTZ DEFAULT NOW(),
  upgraded_at  TIMESTAMPTZ
);

COMMENT ON TABLE public.assets IS 'All player-owned buildings placed on the map.';

-- ─── 6. Asset Marketplace Listings ──────────────────────────
-- When a player lists an asset for sale to other players.

CREATE TABLE IF NOT EXISTS public.asset_listings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  seller_id  UUID NOT NULL REFERENCES public.profiles(id),
  buyer_id   UUID REFERENCES public.profiles(id),     -- NULL until sold
  price      BIGINT NOT NULL,
  status     TEXT DEFAULT 'active'
               CHECK (status IN ('active','sold','cancelled')),
  listed_at  TIMESTAMPTZ DEFAULT NOW(),
  sold_at    TIMESTAMPTZ
);

COMMENT ON TABLE public.asset_listings IS 'Peer-to-peer asset marketplace listings.';

-- ─── 7. Game Events Log ──────────────────────────────────────
-- Append-only audit log of all game actions.

CREATE TABLE IF NOT EXISTS public.game_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,               -- e.g. 'building_built', 'proposal_submitted', 'proposal_approved'
  payload    JSONB DEFAULT '{}',          -- event-specific data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.game_events IS 'Append-only audit log of game actions.';

-- ─── 8. Indexes ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_assets_owner              ON public.assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_tile               ON public.assets(tile_id);
CREATE INDEX IF NOT EXISTS idx_assets_location           ON public.assets(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_assets_neighborhood       ON public.assets(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_assets_for_sale           ON public.assets(is_for_sale) WHERE is_for_sale = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_status           ON public.asset_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller           ON public.asset_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_custom_buildings_status   ON public.custom_building_types(status);
CREATE INDEX IF NOT EXISTS idx_custom_buildings_neighbor ON public.custom_building_types(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_game_events_player        ON public.game_events(player_id);
CREATE INDEX IF NOT EXISTS idx_profiles_score            ON public.profiles(score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_power            ON public.profiles(power DESC);

-- ─── 9. Helper Function: Is Neighborhood Editor ──────────────
-- Returns TRUE if player is an explicit neighborhood editor OR has power >= min_editor_power.

CREATE OR REPLACE FUNCTION public.is_neighborhood_editor(p_player_id UUID, p_neighborhood_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_power INTEGER;
  v_min_power INTEGER;
  v_is_explicit BOOLEAN;
BEGIN
  -- 1. Check explicit appointment
  SELECT EXISTS (
    SELECT 1 FROM public.neighborhood_editors
     WHERE neighborhood_id = p_neighborhood_id AND player_id = p_player_id
  ) INTO v_is_explicit;

  IF v_is_explicit THEN
    RETURN TRUE;
  END IF;

  -- 2. Check power threshold
  SELECT power INTO v_power FROM public.profiles WHERE id = p_player_id;
  SELECT min_editor_power INTO v_min_power FROM public.neighborhoods WHERE id = p_neighborhood_id;

  IF v_power IS NOT NULL AND v_min_power IS NOT NULL AND v_power >= v_min_power THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ─── 10. Row Level Security ──────────────────────────────────

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhood_editors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_building_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events           ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read; only owner can insert/update
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- neighborhoods: read for all
DROP POLICY IF EXISTS "neighborhoods_select_all" ON public.neighborhoods;
CREATE POLICY "neighborhoods_select_all" ON public.neighborhoods FOR SELECT USING (true);

-- neighborhood_editors: read for all
DROP POLICY IF EXISTS "editors_select_all" ON public.neighborhood_editors;
CREATE POLICY "editors_select_all" ON public.neighborhood_editors FOR SELECT USING (true);

-- custom_building_types:
-- - Read: Everyone can read approved types, proposer can read own, editors can read pending for their neighborhood
DROP POLICY IF EXISTS "custom_types_select" ON public.custom_building_types;
CREATE POLICY "custom_types_select" ON public.custom_building_types
  FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = proposed_by
    OR public.is_neighborhood_editor(auth.uid(), neighborhood_id)
  );

-- - Insert: Authenticated users can propose (default status 'pending')
DROP POLICY IF EXISTS "custom_types_insert" ON public.custom_building_types;
CREATE POLICY "custom_types_insert" ON public.custom_building_types
  FOR INSERT
  WITH CHECK (auth.uid() = proposed_by AND status = 'pending');

-- - Update: Editors can review and update status/notes; proposer can edit if still pending
DROP POLICY IF EXISTS "custom_types_update" ON public.custom_building_types;
CREATE POLICY "custom_types_update" ON public.custom_building_types
  FOR UPDATE
  USING (
    public.is_neighborhood_editor(auth.uid(), neighborhood_id)
    OR (auth.uid() = proposed_by AND status = 'pending')
  );

-- assets: read for all; only owner can insert/update
DROP POLICY IF EXISTS "assets_select_all" ON public.assets;
CREATE POLICY "assets_select_all"    ON public.assets FOR SELECT USING (true);
DROP POLICY IF EXISTS "assets_insert_own" ON public.assets;
CREATE POLICY "assets_insert_own"    ON public.assets FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "assets_update_own" ON public.assets;
CREATE POLICY "assets_update_own"    ON public.assets FOR UPDATE USING (auth.uid() = owner_id);

-- listings: read for all; seller creates; seller/buyer updates
DROP POLICY IF EXISTS "listings_select_all" ON public.asset_listings;
CREATE POLICY "listings_select_all"  ON public.asset_listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "listings_insert_own" ON public.asset_listings;
CREATE POLICY "listings_insert_own"  ON public.asset_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "listings_update_own" ON public.asset_listings;
CREATE POLICY "listings_update_own"  ON public.asset_listings FOR UPDATE
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- game_events: read for all; only acting player can insert
DROP POLICY IF EXISTS "events_select_all" ON public.game_events;
CREATE POLICY "events_select_all"    ON public.game_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "events_insert_own" ON public.game_events;
CREATE POLICY "events_insert_own"    ON public.game_events FOR INSERT WITH CHECK (auth.uid() = player_id);

-- ─── 11. Auto-Create Profile on Sign-Up Trigger ──────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, joined_at, last_seen_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'player_' || LEFT(NEW.id::TEXT, 8)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── 12. Helper: Update Wealth Recalculation ─────────────────

CREATE OR REPLACE FUNCTION public.recalculate_wealth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_wealth BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_owner := OLD.owner_id;
  ELSE
    v_owner := NEW.owner_id;
  END IF;

  SELECT COALESCE(SUM(market_value), 0)
    INTO v_wealth
    FROM public.assets
   WHERE owner_id = v_owner;

  UPDATE public.profiles
     SET wealth = v_wealth
   WHERE id = v_owner;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_player_wealth ON public.assets;
CREATE TRIGGER update_player_wealth
  AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_wealth();

-- ─── 13. Helper: Update Power Recalculation ──────────────────

CREATE OR REPLACE FUNCTION public.recalculate_power()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_power INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_owner := OLD.owner_id;
  ELSE
    v_owner := NEW.owner_id;
  END IF;

  SELECT COALESCE(10 + SUM(power_bonus), 10)
    INTO v_power
    FROM public.assets
   WHERE owner_id = v_owner;

  UPDATE public.profiles
     SET power = v_power
   WHERE id = v_owner;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_player_power ON public.assets;
CREATE TRIGGER update_player_power
  AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_power();

-- ─── 14. Initial Seed Data: Iranian Neighborhoods ────────────

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power)
VALUES
  ('tehran_vanak', 'تهران', 'ونک', 'منطقه تجاری و نوآوری شمال پایتخت', 35.7575, 51.4099, 4.0, 150),
  ('tehran_tajrish', 'تهران', 'تجریش', 'مرکز تاریخی و مذهبی با ارزش املاک بالا', 35.8055, 51.4312, 4.5, 200),
  ('tehran_saadatabad', 'تهران', 'سعادت‌آباد', 'منطقه مدرن با برج‌ها و مراکز خرید لوکس', 35.7890, 51.3740, 4.0, 180),
  ('tehran_enqelab', 'تهران', 'انقلاب', 'قلب فرهنگی و علمی پایتخت', 35.7008, 51.3912, 3.5, 120),
  ('isfahan_jolfa', 'اصفهان', 'جلفا', 'محله تاریخی، گردشگری و کافه‌های سنتی', 32.6288, 51.6565, 3.0, 140),
  ('shiraz_eram', 'شیراز', 'ارم', 'محله سرسبز دانشگاهی و توریستی باغ ارم', 29.6358, 52.5256, 3.5, 130)
ON CONFLICT (id) DO NOTHING;
