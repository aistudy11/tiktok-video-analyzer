import { ReactNode } from 'react';

import { getThemeBlock } from '@/core/theme';
import {
  Footer as FooterType,
  Header as HeaderType,
} from '@/shared/types/blocks/landing';
import { BackgroundLayer } from '@/themes/tiktok/blocks/background-layer';

export default async function LandingLayout({
  children,
  header,
  footer,
}: {
  children: ReactNode;
  header: HeaderType;
  footer: FooterType;
}) {
  const Header = await getThemeBlock('header');
  const Footer = await getThemeBlock('footer');

  return (
    <div className="h-screen w-screen">
      <BackgroundLayer />
      <Header header={header} />
      {children}
      <Footer footer={footer} />
    </div>
  );
}
