import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { DynamicPage } from '@/shared/types/blocks/landing';
import {
  JsonLd,
  createWebSiteSchema,
  createOrganizationSchema,
} from '@/shared/components/seo/JsonLd';

export const revalidate = 3600;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.index');

  // get page data
  const page: DynamicPage = t.raw('page');

  // load page component
  const Page = await getThemePage('dynamic-page');

  // Schema.org structured data for SEO
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
  const siteName = process.env.NEXT_PUBLIC_APP_NAME || 'TikTok Video Analyzer';

  const websiteSchema = createWebSiteSchema(siteName, siteUrl, {
    description: 'AI-powered TikTok video analysis tool for discovering trends and generating viral content',
  });

  const organizationSchema = createOrganizationSchema(siteName, siteUrl, {
    logo: `${siteUrl}/logo.png`,
    description: 'AI-powered video analysis and content creation platform',
  });

  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <Page locale={locale} page={page} />
    </>
  );
}
