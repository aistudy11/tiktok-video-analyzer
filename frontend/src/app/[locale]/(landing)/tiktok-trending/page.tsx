import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { TikTokTrendingClient } from './client';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const metadata: Metadata = {
  title: 'TikTok Trending Videos - Analyze & Discover',
  description: 'Browse and analyze trending TikTok videos with AI-powered insights',
  openGraph: {
    title: 'TikTok Trending Videos - Analyze & Discover',
    description: 'Browse and analyze trending TikTok videos with AI-powered insights',
  },
};

export default async function TikTokTrendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Build page sections
  const page: DynamicPage = {
    sections: {
      hero: {
        title: 'TikTok Video Analyzer',
        description: 'Discover trending videos and analyze them with AI-powered insights',
        background_image: {
          src: '/imgs/bg/tree.jpg',
          alt: 'hero background',
        },
      },
      generator: {
        component: <TikTokTrendingClient />,
      },
    },
  };

  // Load page component
  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
