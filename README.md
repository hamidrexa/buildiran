# بیلد ایران (BuildIran) 🏰🌍

**یک بازی استراتژیک آنلاین مبتنی بر نقشه واقعی برای وب، اندروید و iOS با یک سورس‌کد مشترک (Expo + React Native).**

---

## 🌟 ساختار پروژه (Architecture)

پروژه بر اساس استاندارد مدرن **Expo SDK 53+** و ساختار ماژولار زیر سازمان‌دهی شده است:

```
buildiran/
├── src/
│   ├── app/                        # مسیریابی بر پایه فایل (Expo Router)
│   │   ├── _layout.tsx             # چیدمان ریشه (RTL فارسی، فونت‌ها، Safe Area)
│   │   ├── index.tsx               # هدایت به نقشه اصلی بازی
│   │   └── (game)/                 # تب‌های بازی
│   │       ├── _layout.tsx         # ناوبری تب‌های پایین (نقشه، جدول، پروفایل)
│   │       ├── index.tsx           # صفحه نقشه تمام‌صفحه و رابط HUD
│   │       ├── leaderboard.tsx     # جدول برترین بازیکنان
│   │       └── profile.tsx         # پروفایل و منابع بازیکن
│   │
│   ├── components/
│   │   ├── ui/                     # کامپوننت‌های پایه رابط کاربری (Text, Button, Card, LoadingScreen)
│   │   ├── map/                    # لایه نقشه چندسکویی (Adaptive Map)
│   │   │   ├── GameMap.tsx         # رابط یکپارچه
│   │   │   ├── GameMap.native.tsx  # رندرینگ موبایل با MapLibre (iOS / Android)
│   │   │   └── GameMap.web.tsx     # رندرینگ وب با MapLibre GL
│   │   └── game/                   # کامپوننت‌های بازی (HUD, BuildingMarker)
│   │
│   ├── store/                      # مدیریت حالت سراسری با Zustand
│   │   ├── useGameStore.ts         # حالت جهان بازی (زمین‌ها، سازه‌ها، رویدادها)
│   │   ├── useMapStore.ts          # موقعیت دید نقشه (Viewport, Zoom)
│   │   └── usePlayerStore.ts       # منابع و اطلاعات پایدار بازیکن (Persisted)
│   │
│   ├── types/                      # تایپ‌های TypeScript
│   │   ├── game.types.ts           # مدل‌های بازی، سازه‌ها، بازیکن، منابع
│   │   └── map.types.ts            # تایپ‌های نقشه و نشانگرها
│   │
│   ├── theme/                      # سیستم طراحی تیره و طلایی لوکس (Tokens)
│   ├── i18n/                       # ترجمه‌ها و متون فارسی راست‌چین (RTL)
│   ├── lib/                        # کلاینت Supabase و ثابت‌ها
│   └── utils/                      # محاسبات جغرافیایی (فاصله، ساخت شبکه کاشی‌ها)
│
├── assets/                         # آیکون‌ها و منابع گرافیکی
├── app.json                        # پیکربندی کامل Expo و پلاگین‌ها
├── eas.json                        # پیکربندی بیلد ابری EAS
└── tsconfig.json                   # پیکربندی TypeScript و Path Aliases (@/*)
```

---

## 🗺️ سیستم نقشه چندسکویی (Cross-Platform Map)

این پروژه از **OpenStreetMap / OpenFreeMap** با وکتور تایل‌های کاملاً رایگان (بدون نیاز به API Key یا پرداخت هزینه) استفاده می‌کند:

* **در وب (Web):** از `maplibre-gl` و `react-map-gl` استفاده می‌شود.
* **در موبایل (iOS & Android):** از `@maplibre/maplibre-react-native` استفاده می‌شود.
* استفاده در کد کامپوننت‌ها بدون درگیر شدن با نوع پلتفرم صورت می‌گیرد:
  ```tsx
  import { GameMap } from '@/components/map/GameMap';
  ```

---

## 🚀 نحوه اجرا (Getting Started)

### ۱. اجرای نسخه وب (Web)
```bash
npm run web
```
مرورگر باز شده و نقشه تعاملی و رابط بازی را نمایش می‌دهد.

### ۲. اجرای نسخه اندروید (Android)
```bash
npm run android
```

### ۳. اجرای نسخه iOS (iOS)
```bash
npm run ios
```

---

## ⚙️ متغیرهای محیطی (Environment Variables)

برای اتصال به پایگاه داده و سیستم آنلاین بی‌درنگ (Realtime)، فایل `.env.local` را بر اساس `.env.example` بسازید:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🎮 گام‌های بعدی در توسعه بازی

این فونداسیون آماده اضافه کردن منطق بازی است:
1. پیاده‌سازی سیستم تصاحب زمین (Claim Land) با کسر سکه و منابع
2. احداث و ارتقای ساختمان‌ها (خانه، مزرعه، بازار، پادگان)
3. تبادل بی‌درنگ رویدادها بین بازیکنان در نقشه از طریق کانال‌های Realtime Supabase
4. نبردها، اتحادها و تجارت بین بازیکنان
