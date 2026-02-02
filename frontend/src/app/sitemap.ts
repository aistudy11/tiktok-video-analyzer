import { MetadataRoute } from 'next';

import { envConfigs } from '@/config';
import { locales } from '@/config/locale';

type AlternateUrls = {
  languages: Record<string, string>;
};

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority: number;
  alternates?: AlternateUrls;
}

/**
 * Public indexable routes (relative paths without locale prefix)
 * Do not include: auth pages, admin pages, settings, activity, chat
 */
const PUBLIC_ROUTES = [
  { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
  { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/showcases', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/updates', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/tiktok-trending', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/docs', changeFrequency: 'weekly' as const, priority: 0.7 },
];

function generateAlternates(path: string, baseUrl: string): AlternateUrls {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    // Default locale (en) uses root path, others use locale prefix
    const localePath = locale === 'en' ? path : `/${locale}${path}`;
    languages[locale] = `${baseUrl}${localePath || '/'}`;
  }

  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = envConfigs.app_url;
  const entries: SitemapEntry[] = [];

  for (const route of PUBLIC_ROUTES) {
    // Add entry for default locale (en) - no prefix
    entries.push({
      url: `${baseUrl}${route.path || '/'}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: generateAlternates(route.path, baseUrl),
    });

    // Add entries for non-default locales
    for (const locale of locales) {
      if (locale === 'en') continue; // Skip default locale, already added

      entries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: generateAlternates(route.path, baseUrl),
      });
    }
  }

  return entries;
}
