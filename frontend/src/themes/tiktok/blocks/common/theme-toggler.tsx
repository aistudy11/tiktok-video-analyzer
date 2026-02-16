'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';

import { AnimatedThemeToggler } from './animated-theme-toggler';
import { Button } from '@/shared/components/ui/button';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shared/components/ui/toggle-group';

export function ThemeToggler({
  type = 'icon',
  className,
}: {
  type?: 'icon' | 'button' | 'toggle';
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  if (!mounted) {
    return null;
  }

  if (type === 'button') {
    return (
      <Button variant="outline" size="sm" className="hover:bg-primary/10">
        {theme === 'titanium' ? <Zap /> : <Sparkles />}
      </Button>
    );
  } else if (type === 'toggle') {
    return (
      <ToggleGroup
        type="single"
        className={` ${className}`}
        value={theme}
        onValueChange={handleThemeChange}
        variant="outline"
      >
        <ToggleGroupItem
          value="titanium"
          onClick={() => setTheme('titanium')}
          aria-label="Switch to V7 Titanium theme"
        >
          <Zap />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="aurora"
          onClick={() => setTheme('aurora')}
          aria-label="Switch to V8 Aurora theme"
        >
          <Sparkles />
        </ToggleGroupItem>
      </ToggleGroup>
    );
  }

  return <AnimatedThemeToggler className={className} />;
}
