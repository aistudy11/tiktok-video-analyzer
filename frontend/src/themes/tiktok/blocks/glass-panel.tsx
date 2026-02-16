'use client';

import { cn } from '@/shared/lib/utils';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'hover' | 'card';
  style?: React.CSSProperties;
}

export function GlassPanel({ children, className, variant = 'default', style }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
        'bg-[var(--glass-panel)] backdrop-blur-[var(--blur-strength)]',
        'border border-[var(--glass-border)]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        variant === 'hover' && 'hover:bg-[rgba(255,255,255,0.08)] hover:border-[var(--glass-border-hover)]',
        variant === 'card' && 'hover:translate-x-1',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
