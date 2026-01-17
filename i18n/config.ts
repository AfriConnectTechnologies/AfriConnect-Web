export const locales = ['en', 'am', 'sw'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  am: 'አማርኛ', // Amharic
  sw: 'Kiswahili', // Swahili
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  am: '🇪🇹',
  sw: '🇰🇪',
};
