/**
 * BuildIran — Career Paths (Story Themes)
 * Defines the 8 available career paths, their visual themes, and their passive buffs.
 */

export type CareerPathId =
  | 'citizen'
  | 'trader'
  | 'industrialist'
  | 'producer'
  | 'business'
  | 'employee'
  | 'famous'
  | 'real_estate';

export interface CareerDef {
  id: CareerPathId;
  nameFa: string;
  descriptionFa: string;
  icon: string;
  color: string;
  buffFa: string;
}

export const CAREER_PATHS: Record<CareerPathId, CareerDef> = {
  citizen: {
    id: 'citizen',
    nameFa: 'شهروند عادی',
    descriptionFa: 'شروع مسیر در شهر بزرگ تهران.',
    icon: '👤',
    color: '#8A93A6',
    buffFa: 'بدون ویژگی خاص',
  },
  trader: {
    id: 'trader',
    nameFa: 'تاجر و دلال',
    descriptionFa: 'متخصص در خرید و فروش املاک در بازار آزاد.',
    icon: '🤝',
    color: '#4FB3C9', // Azure
    buffFa: 'تخفیف در مالیات خرید و فروش',
  },
  industrialist: {
    id: 'industrialist',
    nameFa: 'تأمین‌کننده و صنعتگر',
    descriptionFa: 'تمرکز بر کشاورزی، کارخانجات و زنجیره تأمین.',
    icon: '🏭',
    color: '#4CBB8F', // Emerald
    buffFa: '+۲۰٪ قدرت بیشتر از پر کردن انبارها',
  },
  producer: {
    id: 'producer',
    nameFa: 'تولیدکننده مصالح',
    descriptionFa: 'استاد ساخت و ساز پیشرفته و تأمین مصالح.',
    icon: '🧱',
    color: '#E88D3C', // Orange
    buffFa: 'افزایش سهمیه مصالح یارانه‌ای',
  },
  business: {
    id: 'business',
    nameFa: 'کسب‌وکار و خدمات',
    descriptionFa: 'مدیریت کافه‌ها، فروشگاه‌ها و ارائه خدمات شهری.',
    icon: '☕',
    color: '#D9694F', // Pink
    buffFa: '+۱۵٪ درآمد بیشتر از ارائه خدمات',
  },
  employee: {
    id: 'employee',
    nameFa: 'مدیر منابع انسانی',
    descriptionFa: 'متخصص در استخدام، آموزش و مدیریت کارگران.',
    icon: '👔',
    color: '#5A8FD0', // Indigo
    buffFa: 'هزینه آموزش کارگران ۲۰٪ کمتر است',
  },
  famous: {
    id: 'famous',
    nameFa: 'چهره مشهور',
    descriptionFa: 'تمرکز بر خدمات عمومی، پارک‌ها و محبوبیت در محله.',
    icon: '⭐',
    color: '#C2649A', // Amber
    buffFa: 'پارک‌ها و بیمارستان‌ها محبوبیت بیشتری تولید می‌کنند',
  },
  real_estate: {
    id: 'real_estate',
    nameFa: 'انبوه‌ساز مسکن',
    descriptionFa: 'پیمانکار بزرگ برج‌ها و مجتمع‌های مسکونی.',
    icon: '🏗️',
    color: '#8B7BD8', // Slate
    buffFa: '۱۰٪ تخفیف در هزینه ساخت فوری (Fast Build)',
  },
};
