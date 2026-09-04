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
    submit: 'ارسال',
    currency: 'تومان',
  },

  nav: {
    map: 'نقشه',
    assets: 'دارایی‌ها',
    marketplace: 'بازار',
    leaderboard: 'جدول امتیازات',
    profile: 'پروفایل',
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
    villa: 'ویلا',
    shop: 'مغازه',
    mall: 'مرکز خرید',
    market: 'بازار',
    office: 'دفتر اداری',
    farm: 'مزرعه',
    warehouse: 'انبار',
    tower: 'برج دیده‌بانی',
    barracks: 'پادگان',
    custom: 'سازه سفارشی',
    build: 'ساخت',
    upgrade: 'ارتقا',
    demolish: 'تخریب',
    level: 'سطح',
    cost: 'هزینه',
    production: 'تولید',
    powerBonus: 'قدرت',
    marketValue: 'ارزش بازار',
  },

  proposals: {
    proposeNew: 'پیشنهاد نوع سازه جدید',
    proposeDesc: 'طرح و ویژگی‌های سازه جدید را تعریف کنید تا پس از بازبینی ویرایشگران محله، در نقشه قابل احداث شود.',
    title: 'نام فارسی سازه',
    code: 'شناسه انگلیسی',
    category: 'دسته‌بندی',
    categories: {
      residential: 'مسکونی',
      commercial: 'تجاری',
      industrial: 'صنعتی',
      military: 'نظامی',
      cultural: 'فرهنگی',
      tech: 'فناوری و استارتاپ',
    },
    baseCost: 'هزینه پایه ساخت (سکه)',
    powerBonus: 'امتیاز قدرت اعطایی',
    incomeRate: 'درآمد ساعتی',
    customSettingLabel: 'ویژگی یا قابلیت ویژه',
    customSettingPlaceholder: 'مثال: تخفیف مالیات منطقه، محافظ ضد سرقت...',
    submitting: 'در حال ارسال طرح...',
    success: 'طرح با موفقیت برای ویرایشگران محله ارسال شد!',
    statusPending: 'در انتظار بازبینی ویرایشگر',
    statusApproved: 'تأیید شده و قابل ساخت',
    statusRejected: 'رد شده',
  },

  editor: {
    badge: 'ویرایشگر محله',
    dashboard: 'پنل ویرایشگران محله',
    description: 'بازیکنان دارای قدرت بالا مسئول بازبینی، تأیید یا رد طرح‌های ساختمانی جدید هستند.',
    pendingList: 'طرح‌های در انتظار بازبینی',
    noPending: 'هیچ طرح معلقی در این محله وجود ندارد.',
    approve: 'تأیید سازه',
    reject: 'رد پیشنهاد',
    feedbackPlaceholder: 'یادداشت یا دلیل بازبینی (اختیاری)',
    powerThreshold: 'حداقل قدرت مورد نیاز برای ویرایشگری',
    yourPower: 'قدرت فعلی شما',
    leadEditor: 'سرپرست ویرایشگران',
  },

  stats: {
    power: 'قدرت نظامی / نفوذ',
    wealth: 'ثروت کل',
    activity: 'فعالیت روزانه',
    popularity: 'محبوبیت اجتماعی',
    cash: 'موجودی نقد',
  },

  marketplace: {
    title: 'بازار خرید و فروش املاک',
    buy: 'خرید ملک',
    sell: 'فروش در بازار',
    setPrice: 'تعیین قیمت فروش',
    price: 'قیمت فروش',
    seller: 'فروشنده',
    activeListings: 'آگهی‌های فعال',
    noListings: 'در حال حاضر هیچ ملکی برای فروش ثبت نشده است.',
    buySuccess: 'ملک با موفقیت خریداری شد و به قلمرو شما اضافه گردید!',
    listSuccess: 'ملک شما در بازار برای فروش قرار گرفت.',
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
    permissionDenied: 'دسترسی رد شد - شما ویرایشگر این محله نیستید',
    locationError: 'خطا در دریافت موقعیت',
    insufficientFunds: 'موجودی سکه برای این اقدام کافی نیست',
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
      desc: 'خانه، مغازه، مرکز خرید و سازه‌های مختلف بسازید',
    },
    startPlaying: 'شروع بازی',
  },
} as const;

export type TranslationKey = typeof fa;
export default fa;
