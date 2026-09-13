-- ============================================================
--  BuildIran — Tehran Districts
--  Run AFTER:
--    1. "Supabase Schema.sql"
--    2. "economy_migration.sql"
--    3. "build_modes_v1_migration.sql"
--    4. "npc_workers_migration.sql"
--
--  Supabase SQL Editor → New query → Paste → Run
-- ============================================================

-- Migration: Add Tehran Districts to Neighborhoods

ALTER TABLE public.neighborhoods 
  ADD COLUMN IF NOT EXISTS area_number INTEGER,
  ADD COLUMN IF NOT EXISTS area_name TEXT,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT TRUE;

-- Insert Districts
INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_اراج', 
  'تهران', 
  'اراج', 
  'محله اراج واقع در منطقه ۱ شهر تهران',
  35.7937747353475, 
  51.486803721638, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_ازگل', 
  'تهران', 
  'ازگل', 
  'محله ازگل واقع در منطقه ۱ شهر تهران',
  35.78854142484045, 
  51.5164704782265, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_امام زاده قاسم', 
  'تهران', 
  'امام زاده قاسم', 
  'محله امام زاده قاسم واقع در منطقه ۱ شهر تهران',
  35.81164363237345, 
  51.44088123500789, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_اوین', 
  'تهران', 
  'اوین', 
  'محله اوین واقع در منطقه ۱ شهر تهران',
  35.80089494391315, 
  51.39467236490745, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_باغ فردوس', 
  'تهران', 
  'باغ فردوس', 
  'محله باغ فردوس واقع در منطقه ۱ شهر تهران',
  35.7956602004478, 
  51.42358482946845, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_تجریش', 
  'تهران', 
  'تجریش', 
  'محله تجریش واقع در منطقه ۱ شهر تهران',
  35.7922155320501, 
  51.4299119396157, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_جماران', 
  'تهران', 
  'جماران', 
  'محله جماران واقع در منطقه ۱ شهر تهران',
  35.82057293821845, 
  51.45921718797405, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_جوزستان', 
  'تهران', 
  'جوزستان', 
  'محله جوزستان واقع در منطقه ۱ شهر تهران',
  35.80746444182205, 
  51.4509288129304, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_چیذر', 
  'تهران', 
  'چیذر', 
  'محله چیذر واقع در منطقه ۱ شهر تهران',
  35.79856045195515, 
  51.45519486022265, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_حصار بوعلی', 
  'تهران', 
  'حصار بوعلی', 
  'محله حصار بوعلی واقع در منطقه ۱ شهر تهران',
  35.80546704982595, 
  51.46808028144725, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_حکمت-دزاشیب', 
  'تهران', 
  'حکمت-دزاشیب', 
  'محله حکمت-دزاشیب واقع در منطقه ۱ شهر تهران',
  35.80081971214755, 
  51.4432261412749, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_دارآباد', 
  'تهران', 
  'دارآباد', 
  'محله دارآباد واقع در منطقه ۱ شهر تهران',
  35.812542925417304, 
  51.49120068608515, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_دربند', 
  'تهران', 
  'دربند', 
  'محله دربند واقع در منطقه ۱ شهر تهران',
  35.8140589168198, 
  51.4238099860937, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_درکه', 
  'تهران', 
  'درکه', 
  'محله درکه واقع در منطقه ۱ شهر تهران',
  35.80320452413285, 
  51.38618603311585, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_رستم اباد', 
  'تهران', 
  'رستم اباد', 
  'محله رستم اباد واقع در منطقه ۱ شهر تهران',
  35.796019492718045, 
  51.472798337917354, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_زعفرانیه', 
  'تهران', 
  'زعفرانیه', 
  'محله زعفرانیه واقع در منطقه ۱ شهر تهران',
  35.80807763410435, 
  51.416050945747244, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_سوهانک', 
  'تهران', 
  'سوهانک', 
  'محله سوهانک واقع در منطقه ۱ شهر تهران',
  35.80315688180595, 
  51.5354727885731, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_شهرک گلها', 
  'تهران', 
  'شهرک گلها', 
  'محله شهرک گلها واقع در منطقه ۱ شهر تهران',
  35.80441618298505, 
  51.4986889659416, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_شهرک محلاتی', 
  'تهران', 
  'شهرک محلاتی', 
  'محله شهرک محلاتی واقع در منطقه ۱ شهر تهران',
  35.80666726893015, 
  51.5153006568138, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_شهرک نفت', 
  'تهران', 
  'شهرک نفت', 
  'محله شهرک نفت واقع در منطقه ۱ شهر تهران',
  35.80912052568595, 
  51.504471197132304, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_قیطریه', 
  'تهران', 
  'قیطریه', 
  'محله قیطریه واقع در منطقه ۱ شهر تهران',
  35.790054797687546, 
  51.44516135747285, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_کاشانک', 
  'تهران', 
  'کاشانک', 
  'محله کاشانک واقع در منطقه ۱ شهر تهران',
  35.81104775160125, 
  51.4794931179729, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_گلاب دره', 
  'تهران', 
  'گلاب دره', 
  'محله گلاب دره واقع در منطقه ۱ شهر تهران',
  35.819895977289946, 
  51.441148472115856, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_محمودیه', 
  'تهران', 
  'محمودیه', 
  'محله محمودیه واقع در منطقه ۱ شهر تهران',
  35.79723433174645, 
  51.4126051233672, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_نیاوران', 
  'تهران', 
  'نیاوران', 
  'محله نیاوران واقع در منطقه ۱ شهر تهران',
  35.81885183580795, 
  51.46964989212605, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_1_ولنجک', 
  'تهران', 
  'ولنجک', 
  'محله ولنجک واقع در منطقه ۱ شهر تهران',
  35.806757516465055, 
  51.4005457758293, 
  2.0, 
  100, 
  1, 
  'منطقه ۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_اسلام آباد (شهرک نیایش)', 
  'تهران', 
  'اسلام آباد (شهرک نیایش)', 
  'محله اسلام آباد (شهرک نیایش) واقع در منطقه ۲ شهر تهران',
  35.7693481050011, 
  51.3884464459539, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_ایوانک', 
  'تهران', 
  'ایوانک', 
  'محله ایوانک واقع در منطقه ۲ شهر تهران',
  35.757633007626154, 
  51.3568096445927, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_آسمان', 
  'تهران', 
  'آسمان', 
  'محله آسمان واقع در منطقه ۲ شهر تهران',
  35.77772047617225, 
  51.3496065227295, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_آلستوم', 
  'تهران', 
  'آلستوم', 
  'محله آلستوم واقع در منطقه ۲ شهر تهران',
  35.72461900681815, 
  51.35905519720775, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_پردیسان', 
  'تهران', 
  'پردیسان', 
  'محله پردیسان واقع در منطقه ۲ شهر تهران',
  35.7449568260669, 
  51.35669831453055, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_پرواز شرقی', 
  'تهران', 
  'پرواز شرقی', 
  'محله پرواز شرقی واقع در منطقه ۲ شهر تهران',
  35.79233507011595, 
  51.3519543330393, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_پونک', 
  'تهران', 
  'پونک', 
  'محله پونک واقع در منطقه ۲ شهر تهران',
  35.760988833619905, 
  51.33775365469885, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_تهران ویلا', 
  'تهران', 
  'تهران ویلا', 
  'محله تهران ویلا واقع در منطقه ۲ شهر تهران',
  35.722926547408, 
  51.3654655065005, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_توحید', 
  'تهران', 
  'توحید', 
  'محله توحید واقع در منطقه ۲ شهر تهران',
  35.70629009000695, 
  51.3717223767599, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_تیموری', 
  'تهران', 
  'تیموری', 
  'محله تیموری واقع در منطقه ۲ شهر تهران',
  35.707203260913104, 
  51.3517209527271, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_چوب تراش', 
  'تهران', 
  'چوب تراش', 
  'محله چوب تراش واقع در منطقه ۲ شهر تهران',
  35.7158870435421, 
  51.34416173796825, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_خرم رودی', 
  'تهران', 
  'خرم رودی', 
  'محله خرم رودی واقع در منطقه ۲ شهر تهران',
  35.7335768032202, 
  51.3442418090215, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_درختی', 
  'تهران', 
  'درختی', 
  'محله درختی واقع در منطقه ۲ شهر تهران',
  35.76884119979895, 
  51.3539788479312, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_دریا', 
  'تهران', 
  'دریا', 
  'محله دریا واقع در منطقه ۲ شهر تهران',
  35.77437470443575, 
  51.37057590347545, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_زنجان', 
  'تهران', 
  'زنجان', 
  'محله زنجان واقع در منطقه ۲ شهر تهران',
  35.70402565306595, 
  51.357379587843894, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_سعادت آباد', 
  'تهران', 
  'سعادت آباد', 
  'محله سعادت آباد واقع در منطقه ۲ شهر تهران',
  35.785812875528094, 
  51.37706910560875, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_شادمهر', 
  'تهران', 
  'شادمهر', 
  'محله شادمهر واقع در منطقه ۲ شهر تهران',
  35.70921526631345, 
  51.3636992691315, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_شهرآرا', 
  'تهران', 
  'شهرآرا', 
  'محله شهرآرا واقع در منطقه ۲ شهر تهران',
  35.7170184820131, 
  51.3734652997453, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_شهرک آزمایش', 
  'تهران', 
  'شهرک آزمایش', 
  'محله شهرک آزمایش واقع در منطقه ۲ شهر تهران',
  35.733608784226, 
  51.3589179959585, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_شهرک بوعلی', 
  'تهران', 
  'شهرک بوعلی', 
  'محله شهرک بوعلی واقع در منطقه ۲ شهر تهران',
  35.79534597342675, 
  51.36775035683465, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_شهرک غرب', 
  'تهران', 
  'شهرک غرب', 
  'محله شهرک غرب واقع در منطقه ۲ شهر تهران',
  35.758196602019154, 
  51.374288679123, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_شهرک مخابرات', 
  'تهران', 
  'شهرک مخابرات', 
  'محله شهرک مخابرات واقع در منطقه ۲ شهر تهران',
  35.79351806016425, 
  51.35758821694215, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_شهرک هما', 
  'تهران', 
  'شهرک هما', 
  'محله شهرک هما واقع در منطقه ۲ شهر تهران',
  35.738831384275755, 
  51.337447027015855, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_صادقیه', 
  'تهران', 
  'صادقیه', 
  'محله صادقیه واقع در منطقه ۲ شهر تهران',
  35.7219205060646, 
  51.342183860035, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_طرشت', 
  'تهران', 
  'طرشت', 
  'محله طرشت واقع در منطقه ۲ شهر تهران',
  35.70631064213505, 
  51.3435638629405, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_فرحزاد', 
  'تهران', 
  'فرحزاد', 
  'محله فرحزاد واقع در منطقه ۵ شهر تهران',
  35.7896016755367, 
  51.343905281491246, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_کوهسار', 
  'تهران', 
  'کوهسار', 
  'محله کوهسار واقع در منطقه ۲ شهر تهران',
  35.797885693272605, 
  51.37921229094175, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_کوی نصر', 
  'تهران', 
  'کوی نصر', 
  'محله کوی نصر واقع در منطقه ۲ شهر تهران',
  35.73776846503955, 
  51.377642605782555, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_مدیریت', 
  'تهران', 
  'مدیریت', 
  'محله مدیریت واقع در منطقه ۲ شهر تهران',
  35.7737648838418, 
  51.38274209622245, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_2_همایون شهر', 
  'تهران', 
  'همایون شهر', 
  'محله همایون شهر واقع در منطقه ۲ شهر تهران',
  35.71476407982275, 
  51.3569012295975, 
  2.0, 
  100, 
  2, 
  'منطقه ۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_ونک', 
  'تهران', 
  'ونک', 
  'محله ونک واقع در منطقه ۳ شهر تهران',
  35.770435847931296, 
  51.3913993750008, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_آرارات', 
  'تهران', 
  'آرارات', 
  'محله آرارات واقع در منطقه ۳ شهر تهران',
  35.77246362830485, 
  51.400294740768146, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_کاووسیه', 
  'تهران', 
  'کاووسیه', 
  'محله کاووسیه واقع در منطقه ۳ شهر تهران',
  35.76270991933255, 
  51.41341582405995, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_امانیه', 
  'تهران', 
  'امانیه', 
  'محله امانیه واقع در منطقه ۳ شهر تهران',
  35.781145950082, 
  51.41583553300095, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_اراضی عباس آباد', 
  'تهران', 
  'اراضی عباس آباد', 
  'محله اراضی عباس آباد واقع در منطقه ۳ شهر تهران',
  35.74967988977425, 
  51.42963617628065, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_سیدخندان', 
  'تهران', 
  'سیدخندان', 
  'محله سیدخندان واقع در منطقه ۳ شهر تهران',
  35.74712131086005, 
  51.44254704910895, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  false
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_داوودیه', 
  'تهران', 
  'داوودیه', 
  'محله داوودیه واقع در منطقه ۳ شهر تهران',
  35.7589303150338, 
  51.4345780069513, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_حسن اباد- زرگنده', 
  'تهران', 
  'حسن اباد- زرگنده', 
  'محله حسن اباد- زرگنده واقع در منطقه ۳ شهر تهران',
  35.77420125380395, 
  51.4328427977344, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_قبا', 
  'تهران', 
  'قبا', 
  'محله قبا واقع در منطقه ۳ شهر تهران',
  35.760154958819854, 
  51.44844171338925, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_قلهک', 
  'تهران', 
  'قلهک', 
  'محله قلهک واقع در منطقه ۳ شهر تهران',
  35.7736002276844, 
  51.4442172799345, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_درب دوم', 
  'تهران', 
  'درب دوم', 
  'محله درب دوم واقع در منطقه ۳ شهر تهران',
  35.78088836978975, 
  51.442858355445054, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_دروس', 
  'تهران', 
  'دروس', 
  'محله دروس واقع در منطقه ۳ شهر تهران',
  35.772485427876504, 
  51.457666388007155, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_رستم آباد- اختیاریه', 
  'تهران', 
  'رستم آباد- اختیاریه', 
  'محله رستم آباد- اختیاریه واقع در منطقه ۳ شهر تهران',
  35.786617535817854, 
  51.461247893077, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_مهران', 
  'تهران', 
  'مهران', 
  'محله مهران واقع در منطقه ۴ شهر تهران',
  35.748739789689594, 
  51.4564171579638, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_پاسداران- ضرابخانه', 
  'تهران', 
  'پاسداران- ضرابخانه', 
  'محله پاسداران- ضرابخانه واقع در منطقه ۴ شهر تهران',
  35.772168552404, 
  51.4685623027509, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_حسین آباد- مبارک آباد', 
  'تهران', 
  'حسین آباد- مبارک آباد', 
  'محله حسین آباد- مبارک آباد واقع در منطقه ۴ شهر تهران',
  35.7725938076988, 
  51.4787485203479, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_کاظم آباد', 
  'تهران', 
  'کاظم آباد', 
  'محله کاظم آباد واقع در منطقه ۴ شهر تهران',
  35.7495985566925, 
  51.46978373734685, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_لویزان شیان', 
  'تهران', 
  'لویزان شیان', 
  'محله لویزان شیان واقع در منطقه ۴ شهر تهران',
  35.773454534200454, 
  51.50185613275195, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_شمیران نو', 
  'تهران', 
  'شمیران نو', 
  'محله شمیران نو واقع در منطقه ۴ شهر تهران',
  35.75777556564465, 
  51.49885260385675, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_کالاد', 
  'تهران', 
  'کالاد', 
  'محله کالاد واقع در منطقه ۴ شهر تهران',
  35.74048284965005, 
  51.4886702722823, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_شمس آباد', 
  'تهران', 
  'شمس آباد', 
  'محله شمس آباد واقع در منطقه ۴ شهر تهران',
  35.74832339079375, 
  51.4761243318581, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_قاسم آباد', 
  'تهران', 
  'قاسم آباد', 
  'محله قاسم آباد واقع در منطقه ۴ شهر تهران',
  35.76589331795125, 
  51.52482112754075, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_علم و صنعت', 
  'تهران', 
  'علم و صنعت', 
  'محله علم و صنعت واقع در منطقه ۴ شهر تهران',
  35.74159426626015, 
  51.508790757300346, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_نارمک', 
  'تهران', 
  'نارمک', 
  'محله نارمک واقع در منطقه ۴ شهر تهران',
  35.736318039706646, 
  51.50420319570295, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_قنات کوثر', 
  'تهران', 
  'قنات کوثر', 
  'محله قنات کوثر واقع در منطقه ۴ شهر تهران',
  35.7642127126717, 
  51.5326076940801, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_مجید آباد', 
  'تهران', 
  'مجید آباد', 
  'محله مجید آباد واقع در منطقه ۴ شهر تهران',
  35.76225928705826, 
  51.544552930320606, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_کوهسار', 
  'تهران', 
  'کوهسار', 
  'محله کوهسار واقع در منطقه ۴ شهر تهران',
  35.7555624882695, 
  51.5628483715622, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_تهرانپارس شرقی', 
  'تهران', 
  'تهرانپارس شرقی', 
  'محله تهرانپارس شرقی واقع در منطقه ۴ شهر تهران',
  35.739716074505594, 
  51.5463617540277, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_جوادیه', 
  'تهران', 
  'جوادیه', 
  'محله جوادیه واقع در منطقه ۴ شهر تهران',
  35.7327738486065, 
  51.54891854066375, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_گلشن', 
  'تهران', 
  'گلشن', 
  'محله گلشن واقع در منطقه ۴ شهر تهران',
  35.741356757641796, 
  51.5641092162435, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_حکیمیه', 
  'تهران', 
  'حکیمیه', 
  'محله حکیمیه واقع در منطقه ۴ شهر تهران',
  35.73684327166045, 
  51.572153622748104, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_4_تهرانپارس غربی', 
  'تهران', 
  'تهرانپارس غربی', 
  'محله تهرانپارس غربی واقع در منطقه ۴ شهر تهران',
  35.7419000186038, 
  51.53182004252015, 
  2.0, 
  100, 
  4, 
  'منطقه ۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_آپادانا', 
  'تهران', 
  'آپادانا', 
  'محله آپادانا واقع در منطقه ۹ شهر تهران',
  35.707220609839155, 
  51.3291101057374, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_بیمه', 
  'تهران', 
  'بیمه', 
  'محله بیمه واقع در منطقه ۹ شهر تهران',
  35.7055910537312, 
  51.31858068406985, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_اکباتان', 
  'تهران', 
  'اکباتان', 
  'محله اکباتان واقع در منطقه ۹ شهر تهران',
  35.7078584371583, 
  51.30569606134025, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_فردوس', 
  'تهران', 
  'فردوس', 
  'محله فردوس واقع در منطقه ۵ شهر تهران',
  35.72200367951275, 
  51.32168622116455, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_ابوذر', 
  'تهران', 
  'ابوذر', 
  'محله ابوذر واقع در منطقه ۵ شهر تهران',
  35.73103195902695, 
  51.33052830484565, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_مهران', 
  'تهران', 
  'مهران', 
  'محله مهران واقع در منطقه ۵ شهر تهران',
  35.73211930753425, 
  51.31851175659165, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_باغ فیض', 
  'تهران', 
  'باغ فیض', 
  'محله باغ فیض واقع در منطقه ۵ شهر تهران',
  35.74387574252334, 
  51.32251016849045, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_پونک جنوبی', 
  'تهران', 
  'پونک جنوبی', 
  'محله پونک جنوبی واقع در منطقه ۵ شهر تهران',
  35.75750965111685, 
  51.325489376358746, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_پونک جنوبی', 
  'تهران', 
  'پونک جنوبی', 
  'محله پونک جنوبی واقع در منطقه ۵ شهر تهران',
  35.765190295939504, 
  51.32795119129615, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_المهدی', 
  'تهران', 
  'المهدی', 
  'محله المهدی واقع در منطقه ۵ شهر تهران',
  35.77403402747845, 
  51.32762905217655, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_سازمان برنامه شمالی', 
  'تهران', 
  'سازمان برنامه شمالی', 
  'محله سازمان برنامه شمالی واقع در منطقه ۵ شهر تهران',
  35.73761725846785, 
  51.30243506710635, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_شهرک پرواز', 
  'تهران', 
  'شهرک پرواز', 
  'محله شهرک پرواز واقع در منطقه ۵ شهر تهران',
  35.7251159753926, 
  51.305799231467, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_سازمان جنوبی', 
  'تهران', 
  'سازمان جنوبی', 
  'محله سازمان جنوبی واقع در منطقه ۵ شهر تهران',
  35.72502812158395, 
  51.299955149354645, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_شاهین شمالی', 
  'تهران', 
  'شاهین شمالی', 
  'محله شاهین شمالی واقع در منطقه ۵ شهر تهران',
  35.76160417390615, 
  51.315033615550746, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_جنت اباد مرکز', 
  'تهران', 
  'جنت اباد مرکز', 
  'محله جنت اباد مرکز واقع در منطقه ۵ شهر تهران',
  35.7603189867673, 
  51.30307967153075, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_جنت آباد شمالی', 
  'تهران', 
  'جنت آباد شمالی', 
  'محله جنت آباد شمالی واقع در منطقه ۵ شهر تهران',
  35.77140880400305, 
  51.3089023620451, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_ارم', 
  'تهران', 
  'ارم', 
  'محله ارم واقع در منطقه ۵ شهر تهران',
  35.72840295741035, 
  51.28390750636035, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_سازما آب', 
  'تهران', 
  'سازما آب', 
  'محله سازما آب واقع در منطقه ۵ شهر تهران',
  35.740193822154055, 
  51.29010124217595, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_شهرزیبا', 
  'تهران', 
  'شهرزیبا', 
  'محله شهرزیبا واقع در منطقه ۵ شهر تهران',
  35.748279922657105, 
  51.291389306130654, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_شهران جنوبی', 
  'تهران', 
  'شهران جنوبی', 
  'محله شهران جنوبی واقع در منطقه ۵ شهر تهران',
  35.7584116250014, 
  51.29052043184035, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_اندیشه', 
  'تهران', 
  'اندیشه', 
  'محله اندیشه واقع در منطقه ۵ شهر تهران',
  35.7466534009773, 
  51.27827743653615, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_کن', 
  'تهران', 
  'کن', 
  'محله کن واقع در منطقه ۵ شهر تهران',
  35.759297309775405, 
  51.278127665327304, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_بهاران', 
  'تهران', 
  'بهاران', 
  'محله بهاران واقع در منطقه ۵ شهر تهران',
  35.76958845028635, 
  51.273331019295796, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_شهران شمالی', 
  'تهران', 
  'شهران شمالی', 
  'محله شهران شمالی واقع در منطقه ۵ شهر تهران',
  35.773743770600404, 
  51.28725476574575, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_شهرک نفت', 
  'تهران', 
  'شهرک نفت', 
  'محله شهرک نفت واقع در منطقه ۵ شهر تهران',
  35.790359764954104, 
  51.338221136380156, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_شهرک کوهسار', 
  'تهران', 
  'شهرک کوهسار', 
  'محله شهرک کوهسار واقع در منطقه ۵ شهر تهران',
  35.782339837071405, 
  51.3330940270495, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_مرادآباد', 
  'تهران', 
  'مرادآباد', 
  'محله مرادآباد واقع در منطقه ۵ شهر تهران',
  35.78462379691925, 
  51.32471624902995, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_حصارک', 
  'تهران', 
  'حصارک', 
  'محله حصارک واقع در منطقه ۵ شهر تهران',
  35.78207488376076, 
  51.31221572823455, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_5_جنت آباد جنوبی', 
  'تهران', 
  'جنت آباد جنوبی', 
  'محله جنت آباد جنوبی واقع در منطقه ۵ شهر تهران',
  35.7433800396273, 
  51.305221173564846, 
  2.0, 
  100, 
  5, 
  'منطقه ۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_امیرآباد', 
  'تهران', 
  'امیرآباد', 
  'محله امیرآباد واقع در منطقه ۶ شهر تهران',
  35.73713069477765, 
  51.39177411483775, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_ایرانشهر', 
  'تهران', 
  'ایرانشهر', 
  'محله ایرانشهر واقع در منطقه ۶ شهر تهران',
  35.708405899308204, 
  51.4218086843029, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_آرزانتین-ساعی', 
  'تهران', 
  'آرزانتین-ساعی', 
  'محله آرزانتین-ساعی واقع در منطقه ۶ شهر تهران',
  35.73405108239325, 
  51.4158112147438, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_بهجت آباد', 
  'تهران', 
  'بهجت آباد', 
  'محله بهجت آباد واقع در منطقه ۶ شهر تهران',
  35.71767169716915, 
  51.412089452981505, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_پارک لاله', 
  'تهران', 
  'پارک لاله', 
  'محله پارک لاله واقع در منطقه ۶ شهر تهران',
  35.7142708600081, 
  51.398989980093404, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_دانشگاه تهران', 
  'تهران', 
  'دانشگاه تهران', 
  'محله دانشگاه تهران واقع در منطقه ۶ شهر تهران',
  35.7062808915209, 
  51.39861039813305, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_شریعتی', 
  'تهران', 
  'شریعتی', 
  'محله شریعتی واقع در منطقه ۶ شهر تهران',
  35.71755348962185, 
  51.3836135692969, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_شیراز', 
  'تهران', 
  'شیراز', 
  'محله شیراز واقع در منطقه ۳ شهر تهران',
  35.7463544487143, 
  51.40393127423095, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_فاطمی', 
  'تهران', 
  'فاطمی', 
  'محله فاطمی واقع در منطقه ۶ شهر تهران',
  35.71946858208805, 
  51.39484451739695, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_قائم مقام-سنایی', 
  'تهران', 
  'قائم مقام-سنایی', 
  'محله قائم مقام-سنایی واقع در منطقه ۶ شهر تهران',
  35.719723161916605, 
  51.4216426110996, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_قزل قلعه', 
  'تهران', 
  'قزل قلعه', 
  'محله قزل قلعه واقع در منطقه ۶ شهر تهران',
  35.727760688327606, 
  51.394942585671046, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_کشاورز غربی', 
  'تهران', 
  'کشاورز غربی', 
  'محله کشاورز غربی واقع در منطقه ۶ شهر تهران',
  35.7097783873033, 
  51.3840346081185, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_3_گاندی', 
  'تهران', 
  'گاندی', 
  'محله گاندی واقع در منطقه ۳ شهر تهران',
  35.7461117634397, 
  51.41572231323315, 
  2.0, 
  100, 
  3, 
  'منطقه ۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_میدان جهاد', 
  'تهران', 
  'میدان جهاد', 
  'محله میدان جهاد واقع در منطقه ۶ شهر تهران',
  35.7233074429917, 
  51.40706458530835, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_میدان ولیعصر', 
  'تهران', 
  'میدان ولیعصر', 
  'محله میدان ولیعصر واقع در منطقه ۶ شهر تهران',
  35.7082216364074, 
  51.4120581213961, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_نصرت', 
  'تهران', 
  'نصرت', 
  'محله نصرت واقع در منطقه ۶ شهر تهران',
  35.7037620604626, 
  51.38512046456155, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_6_یوسف آباد', 
  'تهران', 
  'یوسف آباد', 
  'محله یوسف آباد واقع در منطقه ۶ شهر تهران',
  35.73593052967955, 
  51.40542478569455, 
  2.0, 
  100, 
  6, 
  'منطقه ۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_نیلوفر- شهید قندی', 
  'تهران', 
  'نیلوفر- شهید قندی', 
  'محله نیلوفر- شهید قندی واقع در منطقه ۷ شهر تهران',
  35.73595831959105, 
  51.43374629490965, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_عباس آباد- اندیشه', 
  'تهران', 
  'عباس آباد- اندیشه', 
  'محله عباس آباد- اندیشه واقع در منطقه ۷ شهر تهران',
  35.72743026345535, 
  51.43344495010115, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_باغ صبا- سهروردی', 
  'تهران', 
  'باغ صبا- سهروردی', 
  'محله باغ صبا- سهروردی واقع در منطقه ۷ شهر تهران',
  35.720017850065446, 
  51.434164357652605, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_امجدیه- خاقانی', 
  'تهران', 
  'امجدیه- خاقانی', 
  'محله امجدیه- خاقانی واقع در منطقه ۷ شهر تهران',
  35.71040878261085, 
  51.42887568130485, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_بهار', 
  'تهران', 
  'بهار', 
  'محله بهار واقع در منطقه ۷ شهر تهران',
  35.709792193941496, 
  51.433877333158094, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_خواجه نصیر- حقوقی', 
  'تهران', 
  'خواجه نصیر- حقوقی', 
  'محله خواجه نصیر- حقوقی واقع در منطقه ۷ شهر تهران',
  35.70431262475505, 
  51.4384243746617, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_کاج', 
  'تهران', 
  'کاج', 
  'محله کاج واقع در منطقه ۷ شهر تهران',
  35.714852714783845, 
  51.441317485731346, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_خواجه نظام غربی', 
  'تهران', 
  'خواجه نظام غربی', 
  'محله خواجه نظام غربی واقع در منطقه ۷ شهر تهران',
  35.713730424301446, 
  51.44659020983925, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_خواجه نظام شرقی', 
  'تهران', 
  'خواجه نظام شرقی', 
  'محله خواجه نظام شرقی واقع در منطقه ۷ شهر تهران',
  35.71142898435985, 
  51.4487820396111, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_گرگان', 
  'تهران', 
  'گرگان', 
  'محله گرگان واقع در منطقه ۷ شهر تهران',
  35.7080207984085, 
  51.449071108776806, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_نظام آباد', 
  'تهران', 
  'نظام آباد', 
  'محله نظام آباد واقع در منطقه ۷ شهر تهران',
  35.7065347853613, 
  51.451737309012046, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_شارق غربی', 
  'تهران', 
  'شارق غربی', 
  'محله شارق غربی واقع در منطقه ۷ شهر تهران',
  35.70959353677155, 
  51.45959612464205, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_شارق شرقی', 
  'تهران', 
  'شارق شرقی', 
  'محله شارق شرقی واقع در منطقه ۷ شهر تهران',
  35.7124134304365, 
  51.46591153805955, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_دهقان', 
  'تهران', 
  'دهقان', 
  'محله دهقان واقع در منطقه ۷ شهر تهران',
  35.71407397787365, 
  51.4565736003549, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_ارامنه جنوبی', 
  'تهران', 
  'ارامنه جنوبی', 
  'محله ارامنه جنوبی واقع در منطقه ۷ شهر تهران',
  35.7183660194828, 
  51.45539173420745, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_ارامنه شمالی', 
  'تهران', 
  'ارامنه شمالی', 
  'محله ارامنه شمالی واقع در منطقه ۷ شهر تهران',
  35.7211519418247, 
  51.4579210247212, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_قصر', 
  'تهران', 
  'قصر', 
  'محله قصر واقع در منطقه ۷ شهر تهران',
  35.7261776395328, 
  51.447276270649255, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_حشمتیه', 
  'تهران', 
  'حشمتیه', 
  'محله حشمتیه واقع در منطقه ۷ شهر تهران',
  35.7262833533201, 
  51.456175574968796, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_7_دبستان- مجیدیه', 
  'تهران', 
  'دبستان- مجیدیه', 
  'محله دبستان- مجیدیه واقع در منطقه ۷ شهر تهران',
  35.7355979934001, 
  51.455921098378795, 
  2.0, 
  100, 
  7, 
  'منطقه ۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_مجیدیه', 
  'تهران', 
  'مجیدیه', 
  'محله مجیدیه واقع در منطقه ۸ شهر تهران',
  35.7355508655054, 
  51.46639314775535, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_کرمان', 
  'تهران', 
  'کرمان', 
  'محله کرمان واقع در منطقه ۸ شهر تهران',
  35.73201971582185, 
  51.473768293747895, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_فدک', 
  'تهران', 
  'فدک', 
  'محله فدک واقع در منطقه ۸ شهر تهران',
  35.72867428245905, 
  51.47985063111385, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_هفت حوض', 
  'تهران', 
  'هفت حوض', 
  'محله هفت حوض واقع در منطقه ۸ شهر تهران',
  35.7285373199194, 
  51.489876307120696, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_مدائن', 
  'تهران', 
  'مدائن', 
  'محله مدائن واقع در منطقه ۸ شهر تهران',
  35.72763305569265, 
  51.4970213788679, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_دردشت', 
  'تهران', 
  'دردشت', 
  'محله دردشت واقع در منطقه ۸ شهر تهران',
  35.72699955826205, 
  51.50838955286305, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_تهرانپارس', 
  'تهران', 
  'تهرانپارس', 
  'محله تهرانپارس واقع در منطقه ۸ شهر تهران',
  35.7254823061797, 
  51.5202375263001, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_لشگر غربی', 
  'تهران', 
  'لشگر غربی', 
  'محله لشگر غربی واقع در منطقه ۸ شهر تهران',
  35.7248881106855, 
  51.46377473116925, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_تسحیلات', 
  'تهران', 
  'تسحیلات', 
  'محله تسحیلات واقع در منطقه ۸ شهر تهران',
  35.719411493262854, 
  51.473017268216154, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_وحیدیه', 
  'تهران', 
  'وحیدیه', 
  'محله وحیدیه واقع در منطقه ۸ شهر تهران',
  35.7148160726303, 
  51.47142291027305, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_زرکش', 
  'تهران', 
  'زرکش', 
  'محله زرکش واقع در منطقه ۸ شهر تهران',
  35.71635380589875, 
  51.4797878924222, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_نارمک جنوبی', 
  'تهران', 
  'نارمک جنوبی', 
  'محله نارمک جنوبی واقع در منطقه ۸ شهر تهران',
  35.716978692817946, 
  51.4923648811545, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_8_لشگر شرقی', 
  'تهران', 
  'لشگر شرقی', 
  'محله لشگر شرقی واقع در منطقه ۸ شهر تهران',
  35.7278612327161, 
  51.4656199762878, 
  2.0, 
  100, 
  8, 
  'منطقه ۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_دکترهوشیار', 
  'تهران', 
  'دکترهوشیار', 
  'محله دکترهوشیار واقع در منطقه ۹ شهر تهران',
  35.6945483157271, 
  51.3509997753592, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_استادمعین', 
  'تهران', 
  'استادمعین', 
  'محله استادمعین واقع در منطقه ۹ شهر تهران',
  35.6952825057397, 
  51.3409099743063, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_شهید دست غیب', 
  'تهران', 
  'شهید دست غیب', 
  'محله شهید دست غیب واقع در منطقه ۹ شهر تهران',
  35.685803919978895, 
  51.348035529803354, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_امام زاده عبداله', 
  'تهران', 
  'امام زاده عبداله', 
  'محله امام زاده عبداله واقع در منطقه ۹ شهر تهران',
  35.67826496133835, 
  51.34861299253915, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_شمشیری', 
  'تهران', 
  'شمشیری', 
  'محله شمشیری واقع در منطقه ۹ شهر تهران',
  35.670567830050004, 
  51.3441560590893, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_مهرابادجنوبی', 
  'تهران', 
  'مهرابادجنوبی', 
  'محله مهرابادجنوبی واقع در منطقه ۹ شهر تهران',
  35.678143400656054, 
  51.3380005914974, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_سرآسیاب مهرآباد', 
  'تهران', 
  'سرآسیاب مهرآباد', 
  'محله سرآسیاب مهرآباد واقع در منطقه ۹ شهر تهران',
  35.6721118753484, 
  51.3289835586813, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_عمار', 
  'تهران', 
  'عمار', 
  'محله عمار واقع در منطقه ۹ شهر تهران',
  35.67267311818025, 
  51.31590950138955, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_فرودگاه', 
  'تهران', 
  'فرودگاه', 
  'محله فرودگاه واقع در منطقه ۹ شهر تهران',
  35.6879044406051, 
  51.31270130049, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_9_فتح', 
  'تهران', 
  'فتح', 
  'محله فتح واقع در منطقه ۹ شهر تهران',
  35.679353440768296, 
  51.29381534375365, 
  2.0, 
  100, 
  9, 
  'منطقه ۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_سلسبیل شمالی', 
  'تهران', 
  'سلسبیل شمالی', 
  'محله سلسبیل شمالی واقع در منطقه ۱۰ شهر تهران',
  35.6953724426519, 
  51.37232212219775, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_سلسبیل جنوبی', 
  'تهران', 
  'سلسبیل جنوبی', 
  'محله سلسبیل جنوبی واقع در منطقه ۱۰ شهر تهران',
  35.685968178490896, 
  51.3750950220116, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_بریانک', 
  'تهران', 
  'بریانک', 
  'محله بریانک واقع در منطقه ۱۰ شهر تهران',
  35.675036743910354, 
  51.3773577439402, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_هفت چنار', 
  'تهران', 
  'هفت چنار', 
  'محله هفت چنار واقع در منطقه ۱۰ شهر تهران',
  35.67458442604955, 
  51.368783304354395, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_سلیمانی تیموری', 
  'تهران', 
  'سلیمانی تیموری', 
  'محله سلیمانی تیموری واقع در منطقه ۱۰ شهر تهران',
  35.67380947283895, 
  51.364720456553954, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_شبیری-جی', 
  'تهران', 
  'شبیری-جی', 
  'محله شبیری-جی واقع در منطقه ۱۰ شهر تهران',
  35.6748495054091, 
  51.3565647208158, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_کارون جنوبی', 
  'تهران', 
  'کارون جنوبی', 
  'محله کارون جنوبی واقع در منطقه ۱۰ شهر تهران',
  35.6853546832637, 
  51.36757759249705, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_کارون شمالی', 
  'تهران', 
  'کارون شمالی', 
  'محله کارون شمالی واقع در منطقه ۱۰ شهر تهران',
  35.6949664870141, 
  51.3665578735564, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_زنجان جنوبی', 
  'تهران', 
  'زنجان جنوبی', 
  'محله زنجان جنوبی واقع در منطقه ۱۰ شهر تهران',
  35.69473694104035, 
  51.35956462396055, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_10_هاشمی', 
  'تهران', 
  'هاشمی', 
  'محله هاشمی واقع در منطقه ۱۰ شهر تهران',
  35.68477059213225, 
  51.3592816145388, 
  2.0, 
  100, 
  10, 
  'منطقه ۱۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_جمهوری', 
  'تهران', 
  'جمهوری', 
  'محله جمهوری واقع در منطقه ۱۱ شهر تهران',
  35.697251648686205, 
  51.38209979681055, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_جمالزاده-حشمت دوله', 
  'تهران', 
  'جمالزاده-حشمت دوله', 
  'محله جمالزاده-حشمت دوله واقع در منطقه ۱۱ شهر تهران',
  35.697096390590445, 
  51.388221557625755, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_فلسطین-انقلاب', 
  'تهران', 
  'فلسطین-انقلاب', 
  'محله فلسطین-انقلاب واقع در منطقه ۱۱ شهر تهران',
  35.69823714650935, 
  51.40202292078865, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_اسکندری', 
  'تهران', 
  'اسکندری', 
  'محله اسکندری واقع در منطقه ۱۱ شهر تهران',
  35.688418748116405, 
  51.3815250693542, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_میدان حر', 
  'تهران', 
  'میدان حر', 
  'محله میدان حر واقع در منطقه ۱۱ شهر تهران',
  35.68727587209, 
  51.388054052890254, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_آذربایجان', 
  'تهران', 
  'آذربایجان', 
  'محله آذربایجان واقع در منطقه ۱۱ شهر تهران',
  35.69157500631365, 
  51.398000678876244, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_منیریه', 
  'تهران', 
  'منیریه', 
  'محله منیریه واقع در منطقه ۱۱ شهر تهران',
  35.6838393129864, 
  51.401396463536045, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_خرمشهر', 
  'تهران', 
  'خرمشهر', 
  'محله خرمشهر واقع در منطقه ۱۱ شهر تهران',
  35.67654201473405, 
  51.3840069591239, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_مخصوص', 
  'تهران', 
  'مخصوص', 
  'محله مخصوص واقع در منطقه ۱۱ شهر تهران',
  35.67802317653096, 
  51.38920635065905, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_امیریه', 
  'تهران', 
  'امیریه', 
  'محله امیریه واقع در منطقه ۱۱ شهر تهران',
  35.678495963991054, 
  51.401253139192804, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_هلال احمر', 
  'تهران', 
  'هلال احمر', 
  'محله هلال احمر واقع در منطقه ۱۱ شهر تهران',
  35.670836044769004, 
  51.389023866520546, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_قلمستان-برادران جوادیان', 
  'تهران', 
  'قلمستان-برادران جوادیان', 
  'محله قلمستان-برادران جوادیان واقع در منطقه ۱۱ شهر تهران',
  35.6714179333494, 
  51.39755801701705, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_فروزش-امیربهادر', 
  'تهران', 
  'فروزش-امیربهادر', 
  'محله فروزش-امیربهادر واقع در منطقه ۱۱ شهر تهران',
  35.6712319239625, 
  51.403559344498646, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_عباسی', 
  'تهران', 
  'عباسی', 
  'محله عباسی واقع در منطقه ۱۱ شهر تهران',
  35.663688456208604, 
  51.3854444706787, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_انبار نفت', 
  'تهران', 
  'انبار نفت', 
  'محله انبار نفت واقع در منطقه ۱۱ شهر تهران',
  35.663017202566195, 
  51.39063882249985, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_مختاری', 
  'تهران', 
  'مختاری', 
  'محله مختاری واقع در منطقه ۱۱ شهر تهران',
  35.6647826837017, 
  51.4012106955941, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_11_راه آهن', 
  'تهران', 
  'راه آهن', 
  'محله راه آهن واقع در منطقه ۱۱ شهر تهران',
  35.6607912362939, 
  51.3995429232704, 
  2.0, 
  100, 
  11, 
  'منطقه ۱۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_فردوسی', 
  'تهران', 
  'فردوسی', 
  'محله فردوسی واقع در منطقه ۱۲ شهر تهران',
  35.69346198733345, 
  51.418270499832246, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_بهارستان', 
  'تهران', 
  'بهارستان', 
  'محله بهارستان واقع در منطقه ۱۲ شهر تهران',
  35.69369651421955, 
  51.4310927672183, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_دروازه شمیران', 
  'تهران', 
  'دروازه شمیران', 
  'محله دروازه شمیران واقع در منطقه ۱۲ شهر تهران',
  35.69561567376715, 
  51.44090294969125, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_ایران', 
  'تهران', 
  'ایران', 
  'محله ایران واقع در منطقه ۱۲ شهر تهران',
  35.6872778913763, 
  51.4395587015878, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_سنگلج', 
  'تهران', 
  'سنگلج', 
  'محله سنگلج واقع در منطقه ۱۲ شهر تهران',
  35.67651066034815, 
  51.412481554905, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_ارگ پامنار', 
  'تهران', 
  'ارگ پامنار', 
  'محله ارگ پامنار واقع در منطقه ۱۲ شهر تهران',
  35.68108382133655, 
  51.4245328116832, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_بازار', 
  'تهران', 
  'بازار', 
  'محله بازار واقع در منطقه ۱۲ شهر تهران',
  35.67292977913675, 
  51.4270638496345, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_امامزاده یحیی', 
  'تهران', 
  'امامزاده یحیی', 
  'محله امامزاده یحیی واقع در منطقه ۱۲ شهر تهران',
  35.6799042192142, 
  51.4343800856288, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_آبشار', 
  'تهران', 
  'آبشار', 
  'محله آبشار واقع در منطقه ۱۲ شهر تهران',
  35.6789025651412, 
  51.44178611171535, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_تختی', 
  'تهران', 
  'تختی', 
  'محله تختی واقع در منطقه ۱۲ شهر تهران',
  35.662873751221994, 
  51.4102369998601, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_شهید هرندی', 
  'تهران', 
  'شهید هرندی', 
  'محله شهید هرندی واقع در منطقه ۱۲ شهر تهران',
  35.6642141246824, 
  51.42538513664155, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_کوثر', 
  'تهران', 
  'کوثر', 
  'محله کوثر واقع در منطقه ۱۲ شهر تهران',
  35.66379425313146, 
  51.4384096149753, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_12_قیام', 
  'تهران', 
  'قیام', 
  'محله قیام واقع در منطقه ۱۲ شهر تهران',
  35.66960637558935, 
  51.4408856688609, 
  2.0, 
  100, 
  12, 
  'منطقه ۱۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_شهید اسدی', 
  'تهران', 
  'شهید اسدی', 
  'محله شهید اسدی واقع در منطقه ۱۳ شهر تهران',
  35.70184012580845, 
  51.45498686619885, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_صفا', 
  'تهران', 
  'صفا', 
  'محله صفا واقع در منطقه ۱۳ شهر تهران',
  35.694887448400905, 
  51.452358166583, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_زاهد گیلانی', 
  'تهران', 
  'زاهد گیلانی', 
  'محله زاهد گیلانی واقع در منطقه ۱۳ شهر تهران',
  35.6947911052019, 
  51.46085038281845, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_نیروهوایی', 
  'تهران', 
  'نیروهوایی', 
  'محله نیروهوایی واقع در منطقه ۱۳ شهر تهران',
  35.70079721980565, 
  51.47474861542645, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_قاسم آباد', 
  'تهران', 
  'قاسم آباد', 
  'محله قاسم آباد واقع در منطقه ۱۳ شهر تهران',
  35.70765369793015, 
  51.4745017813622, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_دهقان', 
  'تهران', 
  'دهقان', 
  'محله دهقان واقع در منطقه ۱۳ شهر تهران',
  35.69690064614055, 
  51.4765105241066, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_پیروزی', 
  'تهران', 
  'پیروزی', 
  'محله پیروزی واقع در منطقه ۱۳ شهر تهران',
  35.6959182535062, 
  51.486677102385144, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_امامت', 
  'تهران', 
  'امامت', 
  'محله امامت واقع در منطقه ۱۳ شهر تهران',
  35.70962225822635, 
  51.489765347173645, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_شورا', 
  'تهران', 
  'شورا', 
  'محله شورا واقع در منطقه ۱۳ شهر تهران',
  35.71085907931885, 
  51.496647636687996, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_حافظیه', 
  'تهران', 
  'حافظیه', 
  'محله حافظیه واقع در منطقه ۱۳ شهر تهران',
  35.7003800611852, 
  51.495656823320104, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_آشتیانی', 
  'تهران', 
  'آشتیانی', 
  'محله آشتیانی واقع در منطقه ۱۳ شهر تهران',
  35.7151414409163, 
  51.511079879819945, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_زینبیه', 
  'تهران', 
  'زینبیه', 
  'محله زینبیه واقع در منطقه ۱۳ شهر تهران',
  35.7076432719025, 
  51.508301285220554, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_13_سرخه حصار', 
  'تهران', 
  'سرخه حصار', 
  'محله سرخه حصار واقع در منطقه ۱۳ شهر تهران',
  35.7206851759816, 
  51.55095653963895, 
  2.0, 
  100, 
  13, 
  'منطقه ۱۳ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_شکوفه', 
  'تهران', 
  'شکوفه', 
  'محله شکوفه واقع در منطقه ۱۴ شهر تهران',
  35.68250300813865, 
  51.4492354458373, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_جابری', 
  'تهران', 
  'جابری', 
  'محله جابری واقع در منطقه ۱۴ شهر تهران',
  35.68318014519545, 
  51.4525892961786, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_چهارصد دستگاه', 
  'تهران', 
  'چهارصد دستگاه', 
  'محله چهارصد دستگاه واقع در منطقه ۱۴ شهر تهران',
  35.687212665890655, 
  51.456803045206556, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_نیکام', 
  'تهران', 
  'نیکام', 
  'محله نیکام واقع در منطقه ۱۴ شهر تهران',
  35.6824319249738, 
  51.4574682062786, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_دژکام', 
  'تهران', 
  'دژکام', 
  'محله دژکام واقع در منطقه ۱۴ شهر تهران',
  35.67860847476205, 
  51.4535812583321, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_مینای شمالی', 
  'تهران', 
  'مینای شمالی', 
  'محله مینای شمالی واقع در منطقه ۱۴ شهر تهران',
  35.675831110604946, 
  51.452266939409796, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_آهنگران', 
  'تهران', 
  'آهنگران', 
  'محله آهنگران واقع در منطقه ۱۴ شهر تهران',
  35.6785967729527, 
  51.460218334811, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_شاهین', 
  'تهران', 
  'شاهین', 
  'محله شاهین واقع در منطقه ۱۴ شهر تهران',
  35.67402980915155, 
  51.4583901926207, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_بروجردی', 
  'تهران', 
  'بروجردی', 
  'محله بروجردی واقع در منطقه ۱۴ شهر تهران',
  35.68809547580415, 
  51.46425316719415, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_سرآسیاب دولاب', 
  'تهران', 
  'سرآسیاب دولاب', 
  'محله سرآسیاب دولاب واقع در منطقه ۱۴ شهر تهران',
  35.683588990116945, 
  51.46742928376145, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_شیوا', 
  'تهران', 
  'شیوا', 
  'محله شیوا واقع در منطقه ۱۴ شهر تهران',
  35.6803109680538, 
  51.4687514914337, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_شکیب', 
  'تهران', 
  'شکیب', 
  'محله شکیب واقع در منطقه ۱۴ شهر تهران',
  35.67405319772075, 
  51.4682558131467, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_صددستگاه', 
  'تهران', 
  'صددستگاه', 
  'محله صددستگاه واقع در منطقه ۱۴ شهر تهران',
  35.688781412492105, 
  51.4713753067573, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_فرزانه', 
  'تهران', 
  'فرزانه', 
  'محله فرزانه واقع در منطقه ۱۴ شهر تهران',
  35.68489046282275, 
  51.47528421058665, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_نبی اکرم', 
  'تهران', 
  'نبی اکرم', 
  'محله نبی اکرم واقع در منطقه ۱۴ شهر تهران',
  35.68054401632615, 
  51.476673831029956, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_قیام', 
  'تهران', 
  'قیام', 
  'محله قیام واقع در منطقه ۱۴ شهر تهران',
  35.6732475129186, 
  51.4768453973268, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_پرستار', 
  'تهران', 
  'پرستار', 
  'محله پرستار واقع در منطقه ۱۴ شهر تهران',
  35.690183991509045, 
  51.48691737978335, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_سیزده آبان', 
  'تهران', 
  'سیزده آبان', 
  'محله سیزده آبان واقع در منطقه ۱۴ شهر تهران',
  35.685633325362005, 
  51.4852109149318, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_ابوذز', 
  'تهران', 
  'ابوذز', 
  'محله ابوذز واقع در منطقه ۱۴ شهر تهران',
  35.6815012105549, 
  51.48617037285675, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_تاکسیرانی', 
  'تهران', 
  'تاکسیرانی', 
  'محله تاکسیرانی واقع در منطقه ۱۴ شهر تهران',
  35.673497663036144, 
  51.4866395335041, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_قصر فیروزه', 
  'تهران', 
  'قصر فیروزه', 
  'محله قصر فیروزه واقع در منطقه ۱۴ شهر تهران',
  35.67605485578595, 
  51.5048039662716, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_مینای جنوبی', 
  'تهران', 
  'مینای جنوبی', 
  'محله مینای جنوبی واقع در منطقه ۱۴ شهر تهران',
  35.67054974765945, 
  51.4521322875362, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_خاوران', 
  'تهران', 
  'خاوران', 
  'محله خاوران واقع در منطقه ۱۴ شهر تهران',
  35.66445742037435, 
  51.4527325561871, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_دولاب', 
  'تهران', 
  'دولاب', 
  'محله دولاب واقع در منطقه ۱۴ شهر تهران',
  35.6653107955438, 
  51.461184934870204, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_آهنگ شرقی-آهنگ غربی', 
  'تهران', 
  'آهنگ شرقی-آهنگ غربی', 
  'محله آهنگ شرقی-آهنگ غربی واقع در منطقه ۱۴ شهر تهران',
  35.663264232237196, 
  51.476354471332954, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_14_اردیبهشت', 
  'تهران', 
  'اردیبهشت', 
  'محله اردیبهشت واقع در منطقه ۱۴ شهر تهران',
  35.6521559353295, 
  51.502934578619204, 
  2.0, 
  100, 
  14, 
  'منطقه ۱۴ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_افسریه', 
  'تهران', 
  'افسریه', 
  'محله افسریه واقع در منطقه ۱۵ شهر تهران',
  35.6556668115363, 
  51.4941131365932, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_افسریه جنوبی', 
  'تهران', 
  'افسریه جنوبی', 
  'محله افسریه جنوبی واقع در منطقه ۱۵ شهر تهران',
  35.6440321066119, 
  51.4907241446245, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_اسلام آباد والفجر', 
  'تهران', 
  'اسلام آباد والفجر', 
  'محله اسلام آباد والفجر واقع در منطقه ۱۵ شهر تهران',
  35.63986939021455, 
  51.4966184462281, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_ابوذر', 
  'تهران', 
  'ابوذر', 
  'محله ابوذر واقع در منطقه ۱۵ شهر تهران',
  35.6486544240362, 
  51.475147785109655, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_مسعودیه', 
  'تهران', 
  'مسعودیه', 
  'محله مسعودیه واقع در منطقه ۱۵ شهر تهران',
  35.623551606126, 
  51.4961141215294, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_اتابک', 
  'تهران', 
  'اتابک', 
  'محله اتابک واقع در منطقه ۱۵ شهر تهران',
  35.6505608276659, 
  51.4621097864642, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_هاشم آباد', 
  'تهران', 
  'هاشم آباد', 
  'محله هاشم آباد واقع در منطقه ۱۵ شهر تهران',
  35.64483722812385, 
  51.4733426512301, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_مینایی', 
  'تهران', 
  'مینایی', 
  'محله مینایی واقع در منطقه ۱۵ شهر تهران',
  35.6526356725486, 
  51.4556230425723, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_طیب', 
  'تهران', 
  'طیب', 
  'محله طیب واقع در منطقه ۱۵ شهر تهران',
  35.66069524665325, 
  51.45094478573855, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_ولیعصر-بی سیم', 
  'تهران', 
  'ولیعصر-بی سیم', 
  'محله ولیعصر-بی سیم واقع در منطقه ۱۵ شهر تهران',
  35.6534895489579, 
  51.4500487430088, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_شوش', 
  'تهران', 
  'شوش', 
  'محله شوش واقع در منطقه ۱۵ شهر تهران',
  35.65788374758035, 
  51.43835204553725, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_مظاهری', 
  'تهران', 
  'مظاهری', 
  'محله مظاهری واقع در منطقه ۱۵ شهر تهران',
  35.6551136305444, 
  51.43806192666375, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_شهید مطهری', 
  'تهران', 
  'شهید مطهری', 
  'محله شهید مطهری واقع در منطقه ۱۵ شهر تهران',
  35.648736098279045, 
  51.443807977410046, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_شهرک رضویه', 
  'تهران', 
  'شهرک رضویه', 
  'محله شهرک رضویه واقع در منطقه ۱۵ شهر تهران',
  35.61243534560365, 
  51.49611563574505, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_مشیریه', 
  'تهران', 
  'مشیریه', 
  'محله مشیریه واقع در منطقه ۱۵ شهر تهران',
  35.62500824704305, 
  51.4749384378126, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_بروجردی دهقان', 
  'تهران', 
  'بروجردی دهقان', 
  'محله بروجردی دهقان واقع در منطقه ۱۵ شهر تهران',
  35.637361576184446, 
  51.468791006055994, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_کیانشهر جنوبی', 
  'تهران', 
  'کیانشهر جنوبی', 
  'محله کیانشهر جنوبی واقع در منطقه ۱۵ شهر تهران',
  35.6348059910272, 
  51.4500403337715, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_15_کیانشهر شمالی', 
  'تهران', 
  'کیانشهر شمالی', 
  'محله کیانشهر شمالی واقع در منطقه ۱۵ شهر تهران',
  35.6392728676744, 
  51.4492823303943, 
  2.0, 
  100, 
  15, 
  'منطقه ۱۵ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_باغ آذری', 
  'تهران', 
  'باغ آذری', 
  'محله باغ آذری واقع در منطقه ۱۶ شهر تهران',
  35.6526246689459, 
  51.4232838470456, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_جوادیه', 
  'تهران', 
  'جوادیه', 
  'محله جوادیه واقع در منطقه ۱۶ شهر تهران',
  35.652315240027846, 
  51.3977698580078, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_شهرک بعثت', 
  'تهران', 
  'شهرک بعثت', 
  'محله شهرک بعثت واقع در منطقه ۱۶ شهر تهران',
  35.6381880606624, 
  51.4306753600764, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_خزانه', 
  'تهران', 
  'خزانه', 
  'محله خزانه واقع در منطقه ۱۶ شهر تهران',
  35.638973555052104, 
  51.4203312205027, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_علی آباد شمالی', 
  'تهران', 
  'علی آباد شمالی', 
  'محله علی آباد شمالی واقع در منطقه ۱۶ شهر تهران',
  35.64055191585339, 
  51.413996935726246, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_نازی اباد', 
  'تهران', 
  'نازی اباد', 
  'محله نازی اباد واقع در منطقه ۱۶ شهر تهران',
  35.641750128905954, 
  51.401936944280195, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_علی اباد جنوبی', 
  'تهران', 
  'علی اباد جنوبی', 
  'محله علی اباد جنوبی واقع در منطقه ۱۶ شهر تهران',
  35.6257630207212, 
  51.4270162440531, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_تختی', 
  'تهران', 
  'تختی', 
  'محله تختی واقع در منطقه ۱۶ شهر تهران',
  35.6245068731058, 
  51.41546160639329, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_16_یاخچی آباد', 
  'تهران', 
  'یاخچی آباد', 
  'محله یاخچی آباد واقع در منطقه ۱۶ شهر تهران',
  35.62630294754135, 
  51.403550185615245, 
  2.0, 
  100, 
  16, 
  'منطقه ۱۶ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_بلورسازی', 
  'تهران', 
  'بلورسازی', 
  'محله بلورسازی واقع در منطقه ۱۷ شهر تهران',
  35.6626770384276, 
  51.3780952314917, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_باغ خزانه', 
  'تهران', 
  'باغ خزانه', 
  'محله باغ خزانه واقع در منطقه ۱۷ شهر تهران',
  35.6639837223545, 
  51.370661224306446, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_امام زاده حسن', 
  'تهران', 
  'امام زاده حسن', 
  'محله امام زاده حسن واقع در منطقه ۱۷ شهر تهران',
  35.6655868387556, 
  51.3612960266302, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_آذری', 
  'تهران', 
  'آذری', 
  'محله آذری واقع در منطقه ۱۷ شهر تهران',
  35.66704041679175, 
  51.3502419064376, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_مقدم', 
  'تهران', 
  'مقدم', 
  'محله مقدم واقع در منطقه ۱۷ شهر تهران',
  35.65649430543575, 
  51.3732151392787, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_ابوذر شرقی', 
  'تهران', 
  'ابوذر شرقی', 
  'محله ابوذر شرقی واقع در منطقه ۱۷ شهر تهران',
  35.6594757363857, 
  51.366686492385696, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_ابوذر غربی', 
  'تهران', 
  'ابوذر غربی', 
  'محله ابوذر غربی واقع در منطقه ۱۷ شهر تهران',
  35.660742458222146, 
  51.3583508129926, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_گلچین', 
  'تهران', 
  'گلچین', 
  'محله گلچین واقع در منطقه ۱۷ شهر تهران',
  35.65324105028615, 
  51.367211355874545, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_جلیلی', 
  'تهران', 
  'جلیلی', 
  'محله جلیلی واقع در منطقه ۱۷ شهر تهران',
  35.650201317211796, 
  51.3621218653023, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_سجاد', 
  'تهران', 
  'سجاد', 
  'محله سجاد واقع در منطقه ۱۷ شهر تهران',
  35.6544814844541, 
  51.3581061333186, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_یافت آباد', 
  'تهران', 
  'یافت آباد', 
  'محله یافت آباد واقع در منطقه ۱۷ شهر تهران',
  35.6573368188385, 
  51.3495887524252, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_وصفنارد', 
  'تهران', 
  'وصفنارد', 
  'محله وصفنارد واقع در منطقه ۱۷ شهر تهران',
  35.6459115329789, 
  51.35500915512765, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_زمزم', 
  'تهران', 
  'زمزم', 
  'محله زمزم واقع در منطقه ۱۷ شهر تهران',
  35.647310249941995, 
  51.36757801435265, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_17_زهتابی', 
  'تهران', 
  'زهتابی', 
  'محله زهتابی واقع در منطقه ۱۷ شهر تهران',
  35.64172990940315, 
  51.3596741073943, 
  2.0, 
  100, 
  17, 
  'منطقه ۱۷ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_تولید دارو', 
  'تهران', 
  'تولید دارو', 
  'محله تولید دارو واقع در منطقه ۱۸ شهر تهران',
  35.6638953051049, 
  51.339653363729596, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_شهرک امام خمینی', 
  'تهران', 
  'شهرک امام خمینی', 
  'محله شهرک امام خمینی واقع در منطقه ۱۸ شهر تهران',
  35.66238530971315, 
  51.3148052177104, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_هفده شهریور', 
  'تهران', 
  'هفده شهریور', 
  'محله هفده شهریور واقع در منطقه ۱۸ شهر تهران',
  35.669101938667595, 
  51.2935483052687, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_شمس آباد', 
  'تهران', 
  'شمس آباد', 
  'محله شمس آباد واقع در منطقه ۱۸ شهر تهران',
  35.657518095793804, 
  51.3070431281611, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_شادآباد', 
  'تهران', 
  'شادآباد', 
  'محله شادآباد واقع در منطقه ۱۸ شهر تهران',
  35.65605412864435, 
  51.29614987138055, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_خلیج فارس', 
  'تهران', 
  'خلیج فارس', 
  'محله خلیج فارس واقع در منطقه ۱۸ شهر تهران',
  35.65369324234615, 
  51.26657381085245, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_خلیج فارس شمالی', 
  'تهران', 
  'خلیج فارس شمالی', 
  'محله خلیج فارس شمالی واقع در منطقه ۱۸ شهر تهران',
  35.67221211592715, 
  51.257149602835796, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_بهداشت', 
  'تهران', 
  'بهداشت', 
  'محله بهداشت واقع در منطقه ۱۸ شهر تهران',
  35.65670355557165, 
  51.338365286864246, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_ولیعصر شمالی', 
  'تهران', 
  'ولیعصر شمالی', 
  'محله ولیعصر شمالی واقع در منطقه ۱۸ شهر تهران',
  35.650110468237955, 
  51.34060397518575, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_ولیعصر جنوبی', 
  'تهران', 
  'ولیعصر جنوبی', 
  'محله ولیعصر جنوبی واقع در منطقه ۱۸ شهر تهران',
  35.64216442663875, 
  51.34292976078175, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_صادقیه', 
  'تهران', 
  'صادقیه', 
  'محله صادقیه واقع در منطقه ۱۸ شهر تهران',
  35.6372451690223, 
  51.3497425376041, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_شهیدرجایی', 
  'تهران', 
  'شهیدرجایی', 
  'محله شهیدرجایی واقع در منطقه ۱۸ شهر تهران',
  35.63203681254165, 
  51.32896880006865, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_صاحب الزمان', 
  'تهران', 
  'صاحب الزمان', 
  'محله صاحب الزمان واقع در منطقه ۱۸ شهر تهران',
  35.649634631754154, 
  51.3225323946145, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_یافت آباد جنوبی', 
  'تهران', 
  'یافت آباد جنوبی', 
  'محله یافت آباد جنوبی واقع در منطقه ۱۸ شهر تهران',
  35.64067991169375, 
  51.3004705779007, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_18_یافت آباد شمالی', 
  'تهران', 
  'یافت آباد شمالی', 
  'محله یافت آباد شمالی واقع در منطقه ۱۸ شهر تهران',
  35.6481932320883, 
  51.29821729314595, 
  2.0, 
  100, 
  18, 
  'منطقه ۱۸ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_بوستان ولایت', 
  'تهران', 
  'بوستان ولایت', 
  'محله بوستان ولایت واقع در منطقه ۱۹ شهر تهران',
  35.6461844115006, 
  51.38148633908205, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_بهمنیار', 
  'تهران', 
  'بهمنیار', 
  'محله بهمنیار واقع در منطقه ۱۹ شهر تهران',
  35.62695008438675, 
  51.3979171134969, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_خانی آباد جنوبی', 
  'تهران', 
  'خانی آباد جنوبی', 
  'محله خانی آباد جنوبی واقع در منطقه ۱۹ شهر تهران',
  35.62015451373885, 
  51.3954365456269, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_خانی آباد شمالی', 
  'تهران', 
  'خانی آباد شمالی', 
  'محله خانی آباد شمالی واقع در منطقه ۱۹ شهر تهران',
  35.63231045520165, 
  51.38852606064815, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_شریعتی شمالی', 
  'تهران', 
  'شریعتی شمالی', 
  'محله شریعتی شمالی واقع در منطقه ۱۹ شهر تهران',
  35.63832118912395, 
  51.3729949460053, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_شکوفه شمالی', 
  'تهران', 
  'شکوفه شمالی', 
  'محله شکوفه شمالی واقع در منطقه ۱۹ شهر تهران',
  35.63348768047565, 
  51.366227677664796, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_اسفندیاریو بستان', 
  'تهران', 
  'اسفندیاریو بستان', 
  'محله اسفندیاریو بستان واقع در منطقه ۱۹ شهر تهران',
  35.6300498008204, 
  51.3835501965441, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_شریعتی جنوب', 
  'تهران', 
  'شریعتی جنوب', 
  'محله شریعتی جنوب واقع در منطقه ۱۹ شهر تهران',
  35.6234119795584, 
  51.38184095838755, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_شکوفه جنوبی', 
  'تهران', 
  'شکوفه جنوبی', 
  'محله شکوفه جنوبی واقع در منطقه ۱۹ شهر تهران',
  35.620851110650804, 
  51.37103019049935, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_شهیدکاظمی', 
  'تهران', 
  'شهیدکاظمی', 
  'محله شهیدکاظمی واقع در منطقه ۱۹ شهر تهران',
  35.61798059779745, 
  51.35744858622995, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_نعمت آباد', 
  'تهران', 
  'نعمت آباد', 
  'محله نعمت آباد واقع در منطقه ۱۹ شهر تهران',
  35.630394929862845, 
  51.35308452548845, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_دولتخواه', 
  'تهران', 
  'دولتخواه', 
  'محله دولتخواه واقع در منطقه ۱۹ شهر تهران',
  35.62035716115075, 
  51.345044848600295, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_19_اسماعیل آباد', 
  'تهران', 
  'اسماعیل آباد', 
  'محله اسماعیل آباد واقع در منطقه ۱۹ شهر تهران',
  35.618453155835, 
  51.335460736490646, 
  2.0, 
  100, 
  19, 
  'منطقه ۱۹ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_دولت آباد', 
  'تهران', 
  'دولت آباد', 
  'محله دولت آباد واقع در منطقه ۲۰ شهر تهران',
  35.6207642181634, 
  51.4541599438553, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_شهادت', 
  'تهران', 
  'شهادت', 
  'محله شهادت واقع در منطقه ۲۰ شهر تهران',
  35.613325471790105, 
  51.4490584620822, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_صفائیه چشمه علی', 
  'تهران', 
  'صفائیه چشمه علی', 
  'محله صفائیه چشمه علی واقع در منطقه ۲۰ شهر تهران',
  35.603881436756296, 
  51.4489732694107, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_منصوریه و منگل', 
  'تهران', 
  'منصوریه و منگل', 
  'محله منصوریه و منگل واقع در منطقه ۲۰ شهر تهران',
  35.608990903313455, 
  51.4356683455303, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_ابن باویه و ظهیر آباد', 
  'تهران', 
  'ابن باویه و ظهیر آباد', 
  'محله ابن باویه و ظهیر آباد واقع در منطقه ۲۰ شهر تهران',
  35.5957034013085, 
  51.44895321360165, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_شهید غیوری', 
  'تهران', 
  'شهید غیوری', 
  'محله شهید غیوری واقع در منطقه ۲۰ شهر تهران',
  35.6022080485172, 
  51.44234447697485, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_اقدسیه', 
  'تهران', 
  'اقدسیه', 
  'محله اقدسیه واقع در منطقه ۲۰ شهر تهران',
  35.5939833919751, 
  51.4450918582708, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_جوانمرد قصاب', 
  'تهران', 
  'جوانمرد قصاب', 
  'محله جوانمرد قصاب واقع در منطقه ۲۰ شهر تهران',
  35.61502363843585, 
  51.42631338468826, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_علایین', 
  'تهران', 
  'علایین', 
  'محله علایین واقع در منطقه ۲۰ شهر تهران',
  35.57594410695185, 
  51.46159625773315, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_استخر', 
  'تهران', 
  'استخر', 
  'محله استخر واقع در منطقه ۲۰ شهر تهران',
  35.586728637318245, 
  51.4447763612611, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_سرتخت', 
  'تهران', 
  'سرتخت', 
  'محله سرتخت واقع در منطقه ۲۰ شهر تهران',
  35.589182296257704, 
  51.4323490686738, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_نفر آباد و هاشم آباد', 
  'تهران', 
  'نفر آباد و هاشم آباد', 
  'محله نفر آباد و هاشم آباد واقع در منطقه ۲۰ شهر تهران',
  35.5799265645428, 
  51.43669296569795, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_ولی آباد', 
  'تهران', 
  'ولی آباد', 
  'محله ولی آباد واقع در منطقه ۲۰ شهر تهران',
  35.585104252349154, 
  51.430563663300546, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_فیروزآبادی', 
  'تهران', 
  'فیروزآبادی', 
  'محله فیروزآبادی واقع در منطقه ۲۰ شهر تهران',
  35.59535005099845, 
  51.4325988576755, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_دیلمان', 
  'تهران', 
  'دیلمان', 
  'محله دیلمان واقع در منطقه ۲۰ شهر تهران',
  35.6014410445198, 
  51.431102085622, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_حمزه آباد', 
  'تهران', 
  'حمزه آباد', 
  'محله حمزه آباد واقع در منطقه ۲۰ شهر تهران',
  35.59686674424875, 
  51.424513920133904, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_سیزده آبان', 
  'تهران', 
  'سیزده آبان', 
  'محله سیزده آبان واقع در منطقه ۲۰ شهر تهران',
  35.602853535155305, 
  51.411455772838295, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_20_شهید بهشتی', 
  'تهران', 
  'شهید بهشتی', 
  'محله شهید بهشتی واقع در منطقه ۲۰ شهر تهران',
  35.5837956835753, 
  51.41935331970955, 
  2.0, 
  100, 
  20, 
  'منطقه ۲۰ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_تهرانسر مرکزی', 
  'تهران', 
  'تهرانسر مرکزی', 
  'محله تهرانسر مرکزی واقع در منطقه ۲۱ شهر تهران',
  35.696197580648146, 
  51.257289096909304, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک پاسداران', 
  'تهران', 
  'شهرک پاسداران', 
  'محله شهرک پاسداران واقع در منطقه ۲۱ شهر تهران',
  35.69519000970945, 
  51.26230901541875, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_تهرانسر شمالی', 
  'تهران', 
  'تهرانسر شمالی', 
  'محله تهرانسر شمالی واقع در منطقه ۲۱ شهر تهران',
  35.7024310390419, 
  51.261545989175204, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_تهرانسر شرقی', 
  'تهران', 
  'تهرانسر شرقی', 
  'محله تهرانسر شرقی واقع در منطقه ۲۱ شهر تهران',
  35.690829232591696, 
  51.264298549128455, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_باشگاه نفت', 
  'تهران', 
  'باشگاه نفت', 
  'محله باشگاه نفت واقع در منطقه ۲۱ شهر تهران',
  35.7020109073976, 
  51.25262600854465, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_تهرانسر غربی', 
  'تهران', 
  'تهرانسر غربی', 
  'محله تهرانسر غربی واقع در منطقه ۲۱ شهر تهران',
  35.69282498585585, 
  51.24804507857005, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک دریا', 
  'تهران', 
  'شهرک دریا', 
  'محله شهرک دریا واقع در منطقه ۲۱ شهر تهران',
  35.686344176440045, 
  51.236916191027944, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک فرهنگیان', 
  'تهران', 
  'شهرک فرهنگیان', 
  'محله شهرک فرهنگیان واقع در منطقه ۲۱ شهر تهران',
  35.708614964383756, 
  51.28090498190505, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک آزادی', 
  'تهران', 
  'شهرک آزادی', 
  'محله شهرک آزادی واقع در منطقه ۲۱ شهر تهران',
  35.7091133626751, 
  51.26677659697815, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک استقلال', 
  'تهران', 
  'شهرک استقلال', 
  'محله شهرک استقلال واقع در منطقه ۲۱ شهر تهران',
  35.7013179663236, 
  51.227527002627596, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک دانشگاه تهران', 
  'تهران', 
  'شهرک دانشگاه تهران', 
  'محله شهرک دانشگاه تهران واقع در منطقه ۲۱ شهر تهران',
  35.711486700473856, 
  51.199294783452146, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_چیتگرشمالی', 
  'تهران', 
  'چیتگرشمالی', 
  'محله چیتگرشمالی واقع در منطقه ۲۱ شهر تهران',
  35.72471065678475, 
  51.186422246686504, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک شهرداری', 
  'تهران', 
  'شهرک شهرداری', 
  'محله شهرک شهرداری واقع در منطقه ۲۱ شهر تهران',
  35.72595633184805, 
  51.181476670224896, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_ویلاشهر', 
  'تهران', 
  'ویلاشهر', 
  'محله ویلاشهر واقع در منطقه ۲۱ شهر تهران',
  35.72818806645225, 
  51.17486377706165, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_شهرک غزالی', 
  'تهران', 
  'شهرک غزالی', 
  'محله شهرک غزالی واقع در منطقه ۲۱ شهر تهران',
  35.7327250156835, 
  51.16051676985245, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_وردآورد', 
  'تهران', 
  'وردآورد', 
  'محله وردآورد واقع در منطقه ۲۱ شهر تهران',
  35.73736286242185, 
  51.119072440267146, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_21_چیتگر', 
  'تهران', 
  'چیتگر', 
  'محله چیتگر واقع در منطقه ۲۱ شهر تهران',
  35.717805887779704, 
  51.1562361707472, 
  2.0, 
  100, 
  21, 
  'منطقه ۲۱ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_دهکده المپیک', 
  'تهران', 
  'دهکده المپیک', 
  'محله دهکده المپیک واقع در منطقه ۲۲ شهر تهران',
  35.7633061820912, 
  51.2525982225838, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_امید دژبان', 
  'تهران', 
  'امید دژبان', 
  'محله امید دژبان واقع در منطقه ۲۲ شهر تهران',
  35.760255426914995, 
  51.22495140660385, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_زیبادشت بالا', 
  'تهران', 
  'زیبادشت بالا', 
  'محله زیبادشت بالا واقع در منطقه ۲۲ شهر تهران',
  35.752996245761, 
  51.2614301589351, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_گلستان شرقی', 
  'تهران', 
  'گلستان شرقی', 
  'محله گلستان شرقی واقع در منطقه ۲۲ شهر تهران',
  35.753882903457296, 
  51.24729606360265, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_شهرک صدرا', 
  'تهران', 
  'شهرک صدرا', 
  'محله شهرک صدرا واقع در منطقه ۲۲ شهر تهران',
  35.73138023459775, 
  51.26363715107365, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_گلستان غربی', 
  'تهران', 
  'گلستان غربی', 
  'محله گلستان غربی واقع در منطقه ۲۲ شهر تهران',
  35.75244585835675, 
  51.224843223927806, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_دریاچه', 
  'تهران', 
  'دریاچه', 
  'محله دریاچه واقع در منطقه ۲۲ شهر تهران',
  35.737097774188996, 
  51.21651973059945, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_شهرک شهید باقری', 
  'تهران', 
  'شهرک شهید باقری', 
  'محله شهرک شهید باقری واقع در منطقه ۲۲ شهر تهران',
  35.760568207694945, 
  51.2017181125553, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_آزادشهر-پیکان شهر', 
  'تهران', 
  'آزادشهر-پیکان شهر', 
  'محله آزادشهر-پیکان شهر واقع در منطقه ۲۲ شهر تهران',
  35.7477009980816, 
  51.1749918588399, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

INSERT INTO public.neighborhoods (id, city, name_fa, description_fa, center_lat, center_lng, radius_km, min_editor_power, area_number, area_name, is_locked)
VALUES (
  'tehran_dist_22_شهرک دانشگاه صنعتی شریف', 
  'تهران', 
  'شهرک دانشگاه صنعتی شریف', 
  'محله شهرک دانشگاه صنعتی شریف واقع در منطقه ۲۲ شهر تهران',
  35.751850173406694, 
  51.122205504261956, 
  2.0, 
  100, 
  22, 
  'منطقه ۲۲ شهر تهران', 
  true
) ON CONFLICT (id) DO UPDATE SET 
  area_number = EXCLUDED.area_number,
  area_name = EXCLUDED.area_name,
  is_locked = EXCLUDED.is_locked,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;

