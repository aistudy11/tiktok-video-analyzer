/**
 * @fileoverview Storyboard table component for production scripts
 * @input Props: shots (StoryboardShot array), onShotClick
 * @output Renders a detailed storyboard table with shot-by-shot breakdown
 * @pos Displays storyboard data from ProductionScript in a readable table format
 */

'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from '../glass-panel';
import {
  Camera,
  Clock,
  MessageSquare,
  Move,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StoryboardShot } from '@/types/tiktok';

interface StoryboardTableProps {
  shots: StoryboardShot[];
  onShotClick?: (shot: StoryboardShot) => void;
  className?: string;
}

export function StoryboardTable({
  shots,
  onShotClick,
  className,
}: StoryboardTableProps) {
  const [expandedShot, setExpandedShot] = useState<number | null>(null);

  const toggleExpand = (shotNumber: number) => {
    setExpandedShot(expandedShot === shotNumber ? null : shotNumber);
  };

  if (!shots || shots.length === 0) {
    return (
      <GlassPanel className={cn('p-6', className)}>
        <p className="text-muted-foreground text-center">暂无分镜头数据</p>
      </GlassPanel>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          分镜头脚本
        </h3>
        <span className="text-sm text-muted-foreground">
          共 {shots.length} 个镜头
        </span>
      </div>

      {/* Shots List */}
      <div className="space-y-3">
        {shots.map((shot) => (
          <div
            key={shot.shot_number}
            className="cursor-pointer"
            onClick={() => {
              toggleExpand(shot.shot_number);
              onShotClick?.(shot);
            }}
          >
          <GlassPanel
            variant="hover"
            className={cn(
              'overflow-hidden transition-all',
              expandedShot === shot.shot_number && 'ring-1 ring-primary/30'
            )}
          >
            {/* Shot Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Shot Number Badge */}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    #{shot.shot_number}
                  </span>
                </div>

                {/* Time & Duration */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {shot.time_start} - {shot.time_end}
                  </span>
                  <span className="text-muted-foreground">
                    ({shot.duration}s)
                  </span>
                </div>

                {/* Shot Type Badge */}
                <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-foreground">
                  {shot.shot_type}
                </span>
              </div>

              {/* Expand Icon */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {shot.emotion}
                </span>
                {expandedShot === shot.shot_number ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Visual Description (Always Visible) */}
            <div className="px-4 pb-4">
              <p className="text-sm text-foreground/80 line-clamp-2">
                {shot.visual_description}
              </p>
            </div>

            {/* Expanded Content */}
            {expandedShot === shot.shot_number && (
              <div className="border-t border-foreground/5 p-4 space-y-4 bg-background/30">
                {/* Script Text */}
                {shot.script_text && (
                  <div className="flex gap-3">
                    <MessageSquare className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        文案/旁白
                      </span>
                      <p className="text-sm text-foreground">
                        "{shot.script_text}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Description */}
                {shot.action_description && (
                  <div className="flex gap-3">
                    <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        动作描述
                      </span>
                      <p className="text-sm text-foreground">
                        {shot.action_description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Camera & Transition */}
                <div className="flex gap-6">
                  <div className="flex gap-3">
                    <Move className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        镜头运动
                      </span>
                      <p className="text-sm text-foreground">
                        {shot.camera_movement}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      转场
                    </span>
                    <p className="text-sm text-foreground">{shot.transition}</p>
                  </div>
                </div>

                {/* Notes */}
                {shot.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-xs text-primary font-medium">
                      📝 拍摄注意
                    </span>
                    <p className="text-sm text-foreground/80 mt-1">
                      {shot.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </GlassPanel>
          </div>
        ))}
      </div>
    </div>
  );
}
