'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Theme-specific background images
// To customize, add NEXT_PUBLIC_TITANIUM_BG_IMAGE to .env or place image in /public
// Default: Unsplash space/titanium texture (same as V7 design template)
const TITANIUM_BG_IMAGE = process.env.NEXT_PUBLIC_TITANIUM_BG_IMAGE || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2600&auto=format&fit=crop';

export function BackgroundLayer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // V7 Titanium: Static background image
  if (theme === 'titanium') {
    return (
      <>
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `url('${TITANIUM_BG_IMAGE}')`,
            filter: 'grayscale(90%) brightness(0.25) contrast(1.1)',
            transform: 'scale(1.05)',
          }}
        />
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.95) 100%)',
          }}
        />
      </>
    );
  }

  // Light Theme
  if (theme === 'light') {
    return (
      <div className="fixed inset-0 -z-10 bg-background" />
    );
  }

  // V8 Aurora: Animated blob background (Default for Dark/Aurora)
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
        {/* Silver Blob */}
        <div
          className="absolute rounded-full animate-[blob-bounce_12s_infinite_cubic-bezier(0.4,0,0.2,1)]"
          style={{
            top: '-10%',
            left: '-10%',
            width: '50vw',
            height: '50vw',
            background: '#e2e8f0',
            filter: 'blur(80px)',
            opacity: 0.2,
          }}
        />
        {/* Cyan Blob */}
        <div
          className="absolute rounded-full animate-[blob-bounce_12s_infinite_cubic-bezier(0.4,0,0.2,1)]"
          style={{
            top: '-10%',
            right: '-10%',
            width: '60vw',
            height: '60vw',
            background: '#06b6d4',
            filter: 'blur(80px)',
            opacity: 0.3,
            animationDelay: '-2s',
          }}
        />
        {/* Sky Blue Blob */}
        <div
          className="absolute rounded-full animate-[blob-bounce_12s_infinite_cubic-bezier(0.4,0,0.2,1)]"
          style={{
            bottom: '-20%',
            left: '20%',
            width: '70vw',
            height: '70vw',
            background: '#0ea5e9',
            filter: 'blur(80px)',
            opacity: 0.3,
            animationDelay: '-4s',
          }}
        />
      </div>
      {/* Noise overlay */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}
