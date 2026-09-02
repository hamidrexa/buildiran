/**
 * BuildIran — Persian (Farsi) Translations
 * All UI strings in Farsi (RTL)
 */

const fa = {
  app: {
    name: 'بیلد ایران',
    tagline: 'سرزمین خود را بساز',
  },

  common: {
    loading: 'در حال بارگذاری...',
    error: 'خطا رخ داده است',
    retry: 'تلاش مجدد',
    confirm: 'تأیید',
    cancel: 'لغو',
    close: 'بستن',
    back: 'بازگشت',
    save: 'ذخیره',
    delete: 'حذف',
    edit: 'ویرایش',
    yes: 'بله',
    no: 'خیر',
    ok: 'باشه',
    search: 'جستجو...',
    notFound: 'یافت نشد',
  },

  nav: {
    map: 'نقشه',
    profile: 'پروفایل',
    leaderboard: 'جدول امتیازات',
    settings: 'تنظیمات',
  },

  map: {
    title: 'نقشه بازی',
    selectTile: 'یک قطعه زمین انتخاب کنید',
    claimLand: 'ادعای مالکیت',
    buildHere: 'ساخت در اینجا',
    alreadyOwned: 'این زمین قبلاً تملک شده است',
    yourTerritory: 'قلمرو شما',
    enemyTerritory: 'قلمرو دشمن',
    availableLand: 'زمین آزاد',
    zoom: {
      in: 'بزرگ‌نمایی',
      out: 'کوچک‌نمایی',
      myLocation: 'موقعیت من',
    },
  },

  buildings: {
    house: 'خانه',
    farm: 'مزرعه',
    market: 'بازار',
    tower: 'برج دیده‌بانی',
    warehouse: 'انبار',
    barracks: 'پادگان',
    build: 'ساخت',
    upgrade: 'ارتقا',
    demolish: 'تخریب',
    level: 'سطح',
    cost: 'هزینه',
    production: 'تولید',
  },

  resources: {
    gold: 'طلا',
    wood: 'چوب',
    stone: 'سنگ',
    food: 'غذا',
    population: 'جمعیت',
    income: 'درآمد',
  },

  player: {
    profile: 'پروفایل بازیکن',
    rank: 'رتبه',
    level: 'سطح',
    experience: 'تجربه',
    territory: 'قلمرو',
    buildings: 'سازه‌ها',
    joined: 'تاریخ عضویت',
    online: 'آنلاین',
    offline: 'آفلاین',
  },

  leaderboard: {
    title: 'جدول امتیازات',
    rank: '#',
    player: 'بازیکن',
    score: 'امتیاز',
    territory: 'قلمرو (کیلومتر مربع)',
    buildings: 'سازه‌ها',
    topPlayers: 'برترین بازیکنان',
    myRank: 'رتبه من',
  },

  hud: {
    resources: 'منابع',
    actions: 'اقدامات',
    events: 'رویدادها',
    noEvents: 'رویدادی وجود ندارد',
  },

  errors: {
    networkError: 'خطا در اتصال به اینترنت',
    mapLoadError: 'خطا در بارگذاری نقشه',
    serverError: 'خطا در ارتباط با سرور',
    permissionDenied: 'دسترسی رد شد',
    locationError: 'خطا در دریافت موقعیت',
  },

  onboarding: {
    welcome: 'به بیلد ایران خوش آمدید!',
    step1: {
      title: 'نقشه واقعی',
      desc: 'بازی روی نقشه واقعی ایران اتفاق می‌افتد',
    },
    step2: {
      title: 'ادعای زمین',
      desc: 'زمین‌ها را تصرف کنید و امپراتوری خود را بسازید',
    },
    step3: {
      title: 'ساخت و ساز',
      desc: 'خانه، مزرعه و سازه‌های مختلف بسازید',
    },
    startPlaying: 'شروع بازی',
  },
} as const;

export type TranslationKey = typeof fa;
export default fa;
