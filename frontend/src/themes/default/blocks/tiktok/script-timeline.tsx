/**
 * @fileoverview Visual timeline component for script scenes
 * @input Props: scenes (SceneData[]), onEditScene callback
 * @output Renders vertical timeline with scene cards and type indicators
 * @pos Read-only timeline display of script structure with edit triggers
 */

'use client';

import { cn } from '@/shared/lib/utils';
import { GlassPanel } from '../glass-panel';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export interface SceneData {
  id: string;
  number: number;
  type: 'hook' | 'pain' | 'solution' | 'benefit' | 'cta';
  duration: string;
  script: string;
  visual?: string;
  notes?: string;
}

interface ScriptTimelineProps {
  scenes: SceneData[];
  onEditScene?: (id: string) => void;
  className?: string;
}

const sceneTypeConfig = {
  hook: { label: 'HOOK', color: 'var(--scene-hook)', bgClass: 'bg-foreground/10 text-foreground' },
  pain: { label: 'PAIN POINT', color: 'var(--scene-pain)', bgClass: 'bg-muted text-foreground/70' },
  solution: { label: 'SOLUTION', color: 'var(--scene-solution)', bgClass: 'bg-cyan-950/40 text-cyan-400' },
  benefit: { label: 'BENEFIT', color: 'var(--scene-benefit)', bgClass: 'bg-blue-950/40 text-blue-400' },
  cta: { label: 'CTA', color: 'var(--scene-cta)', bgClass: 'bg-purple-950/40 text-purple-400' },
};

export function ScriptTimeline({ scenes, onEditScene, className }: ScriptTimelineProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTitanium = mounted && theme === 'titanium';

  return (
    <div className={cn('relative space-y-0', className)}>
      {scenes.map((scene, index) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          isLast={index === scenes.length - 1}
          isTitanium={isTitanium}
          onEdit={onEditScene ? () => onEditScene(scene.id) : undefined}
        />
      ))}
    </div>
  );
}

interface SceneCardProps {
  scene: SceneData;
  isLast: boolean;
  isTitanium: boolean;
  onEdit?: () => void;
}

function SceneCard({ scene, isLast, isTitanium, onEdit }: SceneCardProps) {
  const config = sceneTypeConfig[scene.type];

  return (
    <div className="relative pl-14 pb-8 group">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute top-10 bottom-0 w-px"
          style={{
            left: isTitanium ? '24px' : '20px',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0))',
          }}
        />
      )}

      {/* Node number */}
      <div
        className={cn(
          'absolute left-0 top-0 flex items-center justify-center text-foreground font-bold z-10',
          'bg-background border border-foreground/20 transition-transform group-hover:scale-110',
          isTitanium ? 'w-12 h-12 rounded-xl text-lg' : 'w-10 h-10 rounded-full text-sm'
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {isTitanium ? String(scene.number).padStart(2, '0') : scene.number}
      </div>

      {/* Duration indicator (V7 only) */}
      {isTitanium && (
        <span className="absolute left-0 top-14 text-[10px] font-mono text-muted-foreground font-bold rotate-90 origin-center translate-y-2 w-12 text-center">
          {scene.duration}
        </span>
      )}

      {/* Content card */}
      <GlassPanel
        variant="hover"
        className={cn(
          'p-6 border-l-[3px]',
          'hover:translate-x-1'
        )}
        style={{ borderLeftColor: config.color }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider',
                config.bgClass
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {config.label}
            </span>
            {!isTitanium && (
              <span className="text-[10px] font-mono text-foreground/40">{scene.duration}</span>
            )}
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Edit
            </button>
          )}
        </div>

        <div className={cn(scene.visual ? 'grid md:grid-cols-2 gap-6' : '')}>
          <div>
            {scene.visual && (
              <span className="block text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                Audio / Script
              </span>
            )}
            <p className="text-[15px] text-foreground/90 font-normal leading-relaxed">
              "{scene.script}"
            </p>
          </div>
          {scene.visual && (
            <div>
              <span className="block text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                Visual Direction
              </span>
              <p className="text-sm text-foreground/70 font-normal leading-relaxed">
                {scene.visual}
              </p>
            </div>
          )}
        </div>

        {scene.notes && (
          <p className="text-xs text-muted-foreground font-mono mt-2">
            Visual: {scene.notes}
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
