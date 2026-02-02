import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { TikTokTrendingClient } from './client';
import { DynamicPage } from '@/shared/types/blocks/landing';
import { JsonLd, createWebSiteSchema } from '@/shared/components/seo/JsonLd';

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

  // Schema.org structured data for SEO
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tiktok-analyzer.example.com';
  const websiteSchema = createWebSiteSchema(
    'TikTok Video Analyzer',
    `${siteUrl}/${locale}/tiktok-trending`,
    {
      description: 'AI-powered TikTok video analysis tool for discovering trends and insights',
    }
  );

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

  return (
    <>
      <JsonLd data={websiteSchema} />
      <Page locale={locale} page={page} />
    </>
  );
}
