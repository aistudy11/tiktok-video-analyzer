/**
 * @fileoverview Production script viewer component
 * @input Props: script (ProductionScript), loading, error, onRegenerate
 * @output Renders complete production script with all sections
 * @pos Main component for displaying generated production scripts
 */

'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from '../glass-panel';
import { StoryboardTable } from './storyboard-table';
import {
  Sparkles,
  Music,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  Zap,
  Heart,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Copy,
} from 'lucide-react';
import type { ProductionScript, BeatPoint } from '@/types/tiktok';

interface ScriptViewerProps {
  script: ProductionScript | null;
  loading?: boolean;
  error?: string | null;
  onRegenerate?: () => void;
  className?: string;
}

type SectionId = 'formula' | 'storyboard' | 'music' | 'reusable' | 'guide';

export function ScriptViewer({
  script,
  loading = false,
  error = null,
  onRegenerate,
  className,
}: ScriptViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['formula', 'storyboard'])
  );
  const [copied, setCopied] = useState(false);

  const toggleSection = (section: SectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCopyScript = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(script, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(script, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadScript = () => {
    if (!script) return;
    const blob = new Blob([JSON.stringify(script, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-script-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading State
  if (loading) {
    return (
      <GlassPanel className={cn('p-8', className)}>
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">生成制作脚本中...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI 正在分析视频并生成详细的分镜头脚本
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  // Error State
  if (error) {
    return (
      <GlassPanel className={cn('p-8', className)}>
        <div className="flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">生成失败</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              重新生成
            </button>
          )}
        </div>
      </GlassPanel>
    );
  }

  // Empty State
  if (!script) {
    return (
      <GlassPanel className={cn('p-8', className)}>
        <div className="flex flex-col items-center justify-center gap-4">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">暂无制作脚本</h3>
            <p className="text-sm text-muted-foreground mt-1">
              完成视频分析后，点击生成制作脚本
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  // Section Header Component
  const SectionHeader = ({
    id,
    icon: Icon,
    title,
    description,
  }: {
    id: SectionId;
    icon: React.ElementType;
    title: string;
    description?: string;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-foreground/5 transition-colors rounded-t-xl"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {expandedSections.has(id) ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">制作脚本已生成</h2>
            <p className="text-sm text-muted-foreground">
              {script.video_info.title} | {script.video_info.duration}秒
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyScript}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制
              </>
            )}
          </button>
          <button
            onClick={handleDownloadScript}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              重新生成
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Success Formula */}
      <GlassPanel className="overflow-hidden">
        <SectionHeader
          id="formula"
          icon={Sparkles}
          title="爆款公式分析"
          description="为什么这个视频能火"
        />
        {expandedSections.has('formula') && (
          <div className="p-4 pt-0 space-y-4">
            {/* Hook */}
            <div className="flex gap-3">
              <Target className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">开头钩子</span>
                <p className="text-sm text-foreground font-medium">
                  {script.success_formula.hook_type}
                </p>
                <p className="text-sm text-foreground/80 mt-1">
                  {script.success_formula.hook_description}
                </p>
              </div>
            </div>

            {/* Content Structure */}
            <div className="flex gap-3">
              <Zap className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">内容结构</span>
                <p className="text-sm text-foreground">
                  {script.success_formula.content_structure}
                </p>
              </div>
            </div>

            {/* Emotional Arc */}
            <div className="flex gap-3">
              <Heart className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">情绪曲线</span>
                <p className="text-sm text-foreground">
                  {script.success_formula.emotional_arc}
                </p>
              </div>
            </div>

            {/* Key Success Factors */}
            <div>
              <span className="text-xs text-muted-foreground">关键成功因素</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {script.success_formula.key_success_factors.map((factor, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Section 2: Storyboard */}
      <GlassPanel className="overflow-hidden">
        <SectionHeader
          id="storyboard"
          icon={BookOpen}
          title="分镜头脚本"
          description={`${script.storyboard.length} 个镜头`}
        />
        {expandedSections.has('storyboard') && (
          <div className="p-4 pt-0">
            <StoryboardTable shots={script.storyboard} />
          </div>
        )}
      </GlassPanel>

      {/* Section 3: Music Beats */}
      <GlassPanel className="overflow-hidden">
        <SectionHeader
          id="music"
          icon={Music}
          title="音乐节奏卡点"
          description={`${script.music_beats.beat_points.length} 个卡点`}
        />
        {expandedSections.has('music') && (
          <div className="p-4 pt-0 space-y-4">
            {/* Music Info */}
            <div className="flex gap-6">
              <div>
                <span className="text-xs text-muted-foreground">音乐风格</span>
                <p className="text-sm text-foreground font-medium">
                  {script.music_beats.music_style}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">BPM 范围</span>
                <p className="text-sm text-foreground font-medium">
                  {script.music_beats.bpm_range}
                </p>
              </div>
            </div>

            {/* Beat Points */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">卡点时刻</span>
              <div className="grid gap-2">
                {script.music_beats.beat_points.map((beat: BeatPoint, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg bg-background/50"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-sm font-bold">
                        {beat.time}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">
                        {beat.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {beat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Section 4: Reusable Elements */}
      <GlassPanel className="overflow-hidden">
        <SectionHeader
          id="reusable"
          icon={Lightbulb}
          title="可复用元素"
          description="直接套用到你的视频"
        />
        {expandedSections.has('reusable') && (
          <div className="p-4 pt-0 space-y-4">
            {/* Opening Hook */}
            <div className="p-4 rounded-lg bg-background/50 space-y-2">
              <h4 className="text-sm font-bold text-foreground">开场钩子技巧</h4>
              <p className="text-sm text-foreground/80">
                <span className="text-muted-foreground">技巧：</span>
                {script.reusable_elements.opening_hook.technique}
              </p>
              <p className="text-sm text-foreground/80">
                <span className="text-muted-foreground">原示例：</span>
                {script.reusable_elements.opening_hook.example}
              </p>
              <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-xs text-primary font-medium">如何改编</span>
                <p className="text-sm text-foreground/80 mt-1">
                  {script.reusable_elements.opening_hook.how_to_adapt}
                </p>
              </div>
            </div>

            {/* Engagement Triggers */}
            {script.reusable_elements.engagement_triggers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground">互动触发点</h4>
                {script.reusable_elements.engagement_triggers.map((trigger, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background/50">
                    <span className="text-xs text-primary font-medium">
                      {trigger.trigger_type}
                    </span>
                    <p className="text-sm text-foreground/80 mt-1">
                      {trigger.original_example}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {trigger.adaptation_tip}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="text-sm font-bold text-foreground">CTA 模板</h4>
              <p className="text-sm text-foreground/80 mt-1">
                <span className="text-muted-foreground">类型：</span>
                {script.reusable_elements.call_to_action.cta_type}
              </p>
              <p className="text-sm text-foreground/80">
                <span className="text-muted-foreground">原文案：</span>
                {script.reusable_elements.call_to_action.original_text}
              </p>
              <div className="mt-2 p-2 rounded bg-primary/10 font-mono text-sm text-primary">
                {script.reusable_elements.call_to_action.template}
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Section 5: Production Guide */}
      <GlassPanel className="overflow-hidden">
        <SectionHeader
          id="guide"
          icon={BookOpen}
          title="制作指南"
          description="从准备到完成"
        />
        {expandedSections.has('guide') && (
          <div className="p-4 pt-0 space-y-4">
            {/* Equipment */}
            <div>
              <span className="text-xs text-muted-foreground">所需设备</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {script.production_guide.equipment_needed.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Preparation Steps */}
            <div>
              <span className="text-xs text-muted-foreground">准备步骤</span>
              <div className="mt-2 space-y-2">
                {script.production_guide.preparation_steps.map((step) => (
                  <div
                    key={step.step}
                    className="flex gap-3 p-3 rounded-lg bg-background/50"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {step.step}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        {step.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Shooting Tips */}
              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="text-sm font-bold text-foreground mb-2">
                  🎬 拍摄技巧
                </h4>
                <ul className="space-y-1">
                  {script.production_guide.shooting_tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-xs text-foreground/80 flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Editing Tips */}
              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="text-sm font-bold text-foreground mb-2">
                  ✂️ 剪辑技巧
                </h4>
                <ul className="space-y-1">
                  {script.production_guide.editing_tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-xs text-foreground/80 flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                预计制作时长：{script.production_guide.estimated_production_time}
              </span>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
