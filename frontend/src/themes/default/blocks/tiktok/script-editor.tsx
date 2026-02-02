/**
 * @fileoverview Script editor component with drag-and-drop scene reordering
 * @input Props: script (GeneratedScript), onScriptChange, onGenerateVideo
 * @output Renders editable script timeline with scene CRUD operations
 * @pos Allows user to modify AI-generated scripts before video generation
 */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from '../glass-panel';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
} from 'lucide-react';
import type { GeneratedScript, ScriptScene } from '@/types/tiktok';

interface ScriptEditorProps {
  script: GeneratedScript;
  onScriptChange: (script: GeneratedScript) => void;
  onGenerateVideo: () => void;
  isGeneratingVideo?: boolean;
  className?: string;
}

const sceneTypeConfig = {
  hook: { label: 'HOOK', color: 'var(--scene-hook)', bgClass: 'bg-foreground/10 text-foreground' },
  pain: { label: 'PAIN POINT', color: 'var(--scene-pain)', bgClass: 'bg-muted text-foreground/70' },
  solution: { label: 'SOLUTION', color: 'var(--scene-solution)', bgClass: 'bg-cyan-950/40 text-cyan-400' },
  benefit: { label: 'BENEFIT', color: 'var(--scene-benefit)', bgClass: 'bg-blue-950/40 text-blue-400' },
  cta: { label: 'CTA', color: 'var(--scene-cta)', bgClass: 'bg-purple-950/40 text-purple-400' },
};

const sceneTypes: ScriptScene['type'][] = ['hook', 'pain', 'solution', 'benefit', 'cta'];

export function ScriptEditor({
  script,
  onScriptChange,
  onGenerateVideo,
  isGeneratingVideo = false,
  className,
}: ScriptEditorProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set([0]));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTitanium = mounted && theme === 'titanium';

  // 更新场景
  const updateScene = useCallback((index: number, updates: Partial<ScriptScene>) => {
    const newScenes = [...script.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    onScriptChange({ ...script, scenes: newScenes });
  }, [script, onScriptChange]);

  // 添加新场景
  const addScene = useCallback(() => {
    const newScene: ScriptScene = {
      scene_number: script.scenes.length + 1,
      duration: `${script.scenes.length * 5}-${(script.scenes.length + 1) * 5}s`,
      type: 'benefit',
      narration: 'Enter your narration here...',
      visual_description: 'Describe the visual here...',
    };
    const newScenes = [...script.scenes, newScene];
    onScriptChange({ ...script, scenes: newScenes });
    setExpandedScenes(prev => new Set([...prev, newScenes.length - 1]));
  }, [script, onScriptChange]);

  // 删除场景
  const deleteScene = useCallback((index: number) => {
    if (script.scenes.length <= 1) return;
    const newScenes = script.scenes.filter((_, i) => i !== index)
      .map((scene, i) => ({ ...scene, scene_number: i + 1 }));
    onScriptChange({ ...script, scenes: newScenes });
    setExpandedScenes(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, [script, onScriptChange]);

  // 移动场景（拖拽）
  const moveScene = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newScenes = [...script.scenes];
    const [movedScene] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, movedScene);
    // 重新编号
    const renumberedScenes = newScenes.map((scene, i) => ({
      ...scene,
      scene_number: i + 1,
    }));
    onScriptChange({ ...script, scenes: renumberedScenes });
  }, [script, onScriptChange]);

  // 切换展开/折叠
  const toggleExpand = useCallback((index: number) => {
    setExpandedScenes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveScene(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Script Editor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {script.title} • {script.total_duration}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addScene}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Scene
          </button>
          <button
            onClick={onGenerateVideo}
            disabled={isGeneratingVideo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-foreground/5 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isGeneratingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Video ($1.50)'
            )}
          </button>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-4">
        {script.scenes.map((scene, index) => {
          const config = sceneTypeConfig[scene.type];
          const isExpanded = expandedScenes.has(index);
          const isDragging = draggedIndex === index;

          return (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'transition-all duration-200',
                isDragging && 'opacity-50'
              )}
            >
              <GlassPanel
                variant="hover"
                className={cn(
                  'p-0 overflow-hidden border-l-[3px]',
                  'hover:border-l-[4px]'
                )}
                style={{ borderLeftColor: config.color }}
              >
                {/* Scene Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground/70">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-foreground font-bold',
                      'bg-background border border-foreground/20'
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {isTitanium ? String(scene.scene_number).padStart(2, '0') : scene.scene_number}
                  </div>

                  <div className="flex-1">
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
                      <span className="text-xs font-mono text-muted-foreground">
                        {scene.duration}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/70 mt-1 line-clamp-1">
                      {scene.narration}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {script.scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScene(index);
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Scene Editor (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-4">
                    {/* Type Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Scene Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {sceneTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => updateScene(index, { type })}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              scene.type === type
                                ? 'bg-foreground text-background'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            )}
                          >
                            {sceneTypeConfig[type].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={scene.duration}
                        onChange={(e) => updateScene(index, { duration: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/50"
                        placeholder="e.g., 0-3s"
                      />
                    </div>

                    {/* Narration */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Narration / Script
                      </label>
                      <textarea
                        value={scene.narration}
                        onChange={(e) => updateScene(index, { narration: e.target.value })}
                        rows={3}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/50 resize-none"
                        placeholder="What to say in this scene..."
                      />
                    </div>

                    {/* Visual Description */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Visual Description
                      </label>
                      <textarea
                        value={scene.visual_description}
                        onChange={(e) => updateScene(index, { visual_description: e.target.value })}
                        rows={2}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/50 resize-none"
                        placeholder="What to show visually..."
                      />
                    </div>

                    {/* Notes (Optional) */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Production Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={scene.notes || ''}
                        onChange={(e) => updateScene(index, { notes: e.target.value || undefined })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/50"
                        placeholder="Additional notes for video production..."
                      />
                    </div>
                  </div>
                )}
              </GlassPanel>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/70">{script.scenes.length}</span> scenes •{' '}
          <span className="font-medium text-foreground/70">{script.total_duration}</span> total
        </div>
        <div className="text-xs text-muted-foreground">
          BGM: {script.bgm_suggestion}
        </div>
      </div>
    </div>
  );
}
