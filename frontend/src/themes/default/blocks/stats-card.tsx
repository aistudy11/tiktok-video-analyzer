'use client';

import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './glass-panel';

interface StatsCardProps {
  label: string;
  value: string | number;
  accentColor?: string;
  className?: string;
}

export function StatsCard({ label, value, accentColor = 'white', className }: StatsCardProps) {
  return (
    <GlassPanel
      className={cn(
        'p-4 flex flex-col items-center justify-center',
        'border-l-2',
        className
      )}
      style={{ borderLeftColor: accentColor }}
    >
      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {label}
      </span>
      <span className="text-xl font-bold text-foreground">
        {typeof value === 'number' ? formatNumber(value) : value}
      </span>
    </GlassPanel>
  );
}

interface StatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  const defaultColors = ['#ffffff', '#22d3ee', '#3b82f6', '#71717a'];

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {stats.map((stat, index) => (
        <StatsCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          accentColor={stat.color || defaultColors[index % defaultColors.length]}
        />
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
