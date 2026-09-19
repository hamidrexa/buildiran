-- ============================================================
--  BuildIran — Careers & Stories Migration (v6)
--  Run AFTER:
--    missions_migration.sql
--
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. Add career_path to profiles ──────────────────────────────────────────
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS career_path TEXT NOT NULL DEFAULT 'citizen';

COMMENT ON COLUMN public.profiles.career_path IS 'The chosen career path / story focus of the player.';

-- ─── 2. Career Buffs Engine ──────────────────────────────────────────────────
-- Centralized function to get a numerical buff multiplier based on the player's career.
CREATE OR REPLACE FUNCTION public.get_career_buff(p_player_id UUID, p_buff_type TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path TEXT;
BEGIN
  SELECT career_path INTO v_path FROM public.profiles WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  CASE p_buff_type
    WHEN 'fast_build_discount' THEN
      IF v_path = 'real_estate' THEN RETURN 0.10; ELSE RETURN 0; END IF;
    WHEN 'service_income_bonus' THEN
      IF v_path = 'business' THEN RETURN 0.15; ELSE RETURN 0; END IF;
    WHEN 'training_cost_discount' THEN
      IF v_path = 'employee' THEN RETURN 0.20; ELSE RETURN 0; END IF;
    WHEN 'warehouse_power_bonus' THEN
      IF v_path = 'industrialist' THEN RETURN 0.20; ELSE RETURN 0; END IF;
    WHEN 'subsidy_quota_bonus' THEN
      IF v_path = 'producer' THEN RETURN 0.25; ELSE RETURN 0; END IF;
    WHEN 'market_tax_discount' THEN
      IF v_path = 'trader' THEN RETURN 0.60; ELSE RETURN 0; END IF; -- 60% reduction in tax (from 5% to 2%)
    WHEN 'park_popularity_bonus' THEN
      IF v_path = 'famous' THEN RETURN 0.50; ELSE RETURN 0; END IF;
    ELSE
      RETURN 0;
  END CASE;
END;
$$;

-- ─── 3. Story Chains Seed Data ───────────────────────────────────────────────

-- Clear previous story test data to ensure clean slate (only affects story category)
DELETE FROM public.mission_definitions WHERE category = 'story';

-- 1. Citizen Start (Onboarding)
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'citizen', 1, 'پایه‌گذاری امپراتوری', 'اولین خانه خود را بسازید تا جریان درآمد شما آغاز شود.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "house"}}]'::jsonb, '{"cash": 1000}'::jsonb, '🏡', 1),
  ('story', 'citizen', 2, 'تأمین منابع', 'اولین ملک خود را در بازار آگهی کنید.', '[{"type": "list_asset_for_sale", "target_value": 1}]'::jsonb, '{"cash": 500, "power": 3}'::jsonb, '📈', 2),
  ('story', 'citizen', 3, 'استفاده از خدمات شهری', 'از یک مؤسسه یا خدمات شهری استفاده کنید.', '[{"type": "use_service", "target_value": 1}]'::jsonb, '{"power": 5, "cash": 500}'::jsonb, '🏙️', 3),
  ('story', 'citizen', 4, 'مشارکت محلی', 'در یکی از محله‌های شهر کاوش کنید.', '[{"type": "explore_neighborhood", "target_value": 1}]'::jsonb, '{"power": 10, "popularity": 10}'::jsonb, '🌍', 4);

-- 2. Trader (Trading & Brokerage)
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'trader', 1, 'دلال کوچک', '۳ ملک خود را برای فروش در بازار ثبت کنید.', '[{"type": "list_asset_for_sale", "target_value": 3}]'::jsonb, '{"cash": 2000}'::jsonb, '🏷️', 1),
  ('story', 'trader', 2, 'بازارساز', '۳ ملک در بازار به فروش برسانید.', '[{"type": "sell_asset", "target_value": 3}]'::jsonb, '{"cash": 5000, "power": 5}'::jsonb, '🤝', 2),
  ('story', 'trader', 3, 'سود کلان', 'از فروش املاک ۲۰,۰۰۰ تومان درآمد کسب کنید.', '[{"type": "earn_from_sale", "target_value": 20000}]'::jsonb, '{"cash": 10000, "popularity": 10}'::jsonb, '💰', 3),
  ('story', 'trader', 4, 'سلطان بازار', 'به قدرت ۱۰۰ برسید و حداقل ۵ معامله موفق داشته باشید.', '[{"type": "reach_power", "target_value": 100}, {"type": "sell_asset", "target_value": 5}]'::jsonb, '{"cash": 20000, "power": 20}'::jsonb, '👑', 4);

-- 3. Industrialist / Supplier
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'industrialist', 1, 'ریشه‌های صنعت', 'یک مزرعه بسازید تا مواد اولیه را تأمین کنید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "farm"}}]'::jsonb, '{"cash": 3000}'::jsonb, '🌾', 1),
  ('story', 'industrialist', 2, 'تولید انبوه', 'یک کارخانه بنا کنید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "factory"}}]'::jsonb, '{"cash": 8000, "power": 15}'::jsonb, '🏭', 2),
  ('story', 'industrialist', 3, 'زنجیره تأمین', '۵ بار از خدمات تأمین انبار (مزرعه/کارخانه) درآمد کسب کنید.', '[{"type": "earn_from_services", "target_value": 5}]'::jsonb, '{"cash": 10000, "power": 25}'::jsonb, '📦', 3),
  ('story', 'industrialist', 4, 'امپراتوری صنعتی', 'به قدرت ۳۰۰ برسید.', '[{"type": "reach_power", "target_value": 300}]'::jsonb, '{"cash": 50000, "activity": 100}'::jsonb, '🏗️', 4);

-- 4. Product Maker / Producer
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'producer', 1, 'ساخت و ساز هوشمند', 'یک بنا احداث کنید.', '[{"type": "build_count_any", "target_value": 1}]'::jsonb, '{"cash": 4000}'::jsonb, '🧱', 1),
  ('story', 'producer', 2, 'ارتقاء کیفیت', 'یکی از ساختمان‌های خود را ارتقاء دهید.', '[{"type": "upgrade_building", "target_value": 1}]'::jsonb, '{"cash": 6000, "power": 10}'::jsonb, '⬆️', 2),
  ('story', 'producer', 3, 'سازنده برتر', '۵ ساختمان در محله‌های مختلف بسازید.', '[{"type": "build_count_any", "target_value": 5}]'::jsonb, '{"cash": 15000, "power": 30}'::jsonb, '👷', 3),
  ('story', 'producer', 4, 'معمار اعظم', 'به سطح شهروند (قدرت ۵۰) برسید.', '[{"type": "reach_tier", "target_value": 2}]'::jsonb, '{"cash": 30000, "power": 50}'::jsonb, '🏛️', 4);

-- 5. Business & Services
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'business', 1, 'افتتاح کسب‌وکار', 'یک کافه یا فروشگاه بسازید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "shop"}}]'::jsonb, '{"cash": 3000}'::jsonb, '☕', 1),
  ('story', 'business', 2, 'جذب مشتری', 'بگذارید ۱۰ بار از خدمات شما استفاده شود.', '[{"type": "provide_service", "target_value": 10}]'::jsonb, '{"cash": 8000, "power": 10}'::jsonb, '👥', 2),
  ('story', 'business', 3, 'گسترش برند', 'یک رستوران یا باشگاه ورزشی احداث کنید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "restaurant"}}]'::jsonb, '{"cash": 12000, "popularity": 20}'::jsonb, '🍽️', 3),
  ('story', 'business', 4, 'درآمدزایی فعال', 'از طریق ارائه خدمات ۲۰,۰۰۰ تومان درآمد کسب کنید.', '[{"type": "earn_from_services", "target_value": 20000}]'::jsonb, '{"cash": 25000, "power": 40}'::jsonb, '💳', 4);

-- 6. Employee / HR Manager
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'employee', 1, 'اولین استخدام', 'یک کارگر (NPC) جدید استخدام کنید.', '[{"type": "hire_npc", "target_value": 1}]'::jsonb, '{"cash": 5000}'::jsonb, '👔', 1),
  ('story', 'employee', 2, 'آموزش و توسعه', 'کارگر خود را در دانشگاه آموزش دهید.', '[{"type": "train_npc", "target_value": 1}]'::jsonb, '{"cash": 8000, "power": 15}'::jsonb, '🎓', 2),
  ('story', 'employee', 3, 'نیروی کارآمد', 'کارگر خود را به یک کسب‌وکار اختصاص دهید.', '[{"type": "assign_npc", "target_value": 1}]'::jsonb, '{"cash": 15000, "activity": 50}'::jsonb, '💼', 3),
  ('story', 'employee', 4, 'مدیر نمونه', '۵ کارگر استخدام کرده و آموزش دهید.', '[{"type": "hire_npc", "target_value": 5}]'::jsonb, '{"cash": 40000, "power": 60}'::jsonb, '🏢', 4);

-- 7. Becoming Famous
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'famous', 1, 'خیر عمومی', 'یک پارک برای استفاده عموم بسازید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "park"}}]'::jsonb, '{"cash": 4000, "popularity": 15}'::jsonb, '🌳', 1),
  ('story', 'famous', 2, 'چهره شناخته شده', 'به محبوبیت ۵۰ برسید.', '[{"type": "reach_popularity", "target_value": 50}]'::jsonb, '{"cash": 10000, "power": 20}'::jsonb, '⭐', 2),
  ('story', 'famous', 3, 'سلامت جامعه', 'یک بیمارستان بنا کنید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "hospital"}}]'::jsonb, '{"cash": 20000, "popularity": 40}'::jsonb, '🏥', 3),
  ('story', 'famous', 4, 'نماینده محله', 'به قدرت ۲۰۰ و محبوبیت ۱۰۰ برسید.', '[{"type": "reach_power", "target_value": 200}]'::jsonb, '{"cash": 50000, "popularity": 100}'::jsonb, '🎤', 4);

-- 8. Real Estate & Construction
INSERT INTO public.mission_definitions (category, chain_code, chain_step, title_fa, description_fa, objectives, rewards, icon, sort_order) VALUES 
  ('story', 'real_estate', 1, 'زندگی لوکس', 'یک ویلا بسازید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "villa"}}]'::jsonb, '{"cash": 8000, "power": 10}'::jsonb, '🏡', 1),
  ('story', 'real_estate', 2, 'برج‌سازی', 'اولین برج خود را احداث کنید.', '[{"type": "build_type", "target_value": 1, "filter": {"building_type": "tower"}}]'::jsonb, '{"cash": 15000, "power": 30}'::jsonb, '🏙️', 2),
  ('story', 'real_estate', 3, 'انبوه‌ساز', '۱۰ ساختمان بنا کنید.', '[{"type": "build_count_any", "target_value": 10}]'::jsonb, '{"cash": 30000, "power": 60}'::jsonb, '🏗️', 3),
  ('story', 'real_estate', 4, 'توسعه‌دهنده محله', 'در یک محله به سطح بالایی از امکانات برسید (ارتقای محله).', '[{"type": "build_count_any", "target_value": 20}]'::jsonb, '{"cash": 100000, "power": 150}'::jsonb, '🌆', 4);
