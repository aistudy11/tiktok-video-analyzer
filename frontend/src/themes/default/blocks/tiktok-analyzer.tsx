'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Play,
  Loader2,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Pencil,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

// 导入 hooks
import { useTiktokAnalyze } from '@/shared/hooks/use-tiktok-analyze';
import { useScriptGenerator } from '@/shared/hooks/use-script-generator';
import { useVideoGenerator } from '@/shared/hooks/use-video-generator';
import type { GeneratedScript } from '@/types/tiktok';

// 导入 V7/V8 组件
import { GlassPanel } from './glass-panel';
import { StatsGrid } from './stats-card';
import {
  ScriptTimeline,
  VideoPreview,
  ScriptEditor,
  VideoResult,
  type SceneData,
} from './tiktok';

// 应用状态机
type AppStage = 'input' | 'analyzing' | 'results' | 'editing' | 'generating-video' | 'video-ready';

export function TiktokAnalyzer({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<AppStage>('input');
  const [script, setScript] = useState<GeneratedScript | null>(null);

  // Hooks
  const {
    status: analyzeStatus,
    result: analyzeResult,
    error: analyzeError,
    analyze,
    reset: resetAnalyze,
  } = useTiktokAnalyze();

  const {
    status: scriptStatus,
    script: generatedScript,
    error: scriptError,
    generateScript,
    reset: resetScript,
  } = useScriptGenerator();

  const {
    status: videoStatus,
    progress: videoProgress,
    videoUrl,
    error: videoError,
    generateVideo,
    reset: resetVideo,
  } = useVideoGenerator();

  // 状态派生
  const isAnalyzing = analyzeStatus === 'submitting' || analyzeStatus === 'processing';
  const showInput = stage === 'input' || stage === 'analyzing';
  const showResults = stage === 'results' && analyzeResult;
  const showEditor = stage === 'editing' && script;
  const showVideoGenerating = stage === 'generating-video';
  const showVideoReady = stage === 'video-ready' && videoUrl;

  // 监听分析状态变化
  useEffect(() => {
    if (analyzeStatus === 'submitting' || analyzeStatus === 'processing') {
      setStage('analyzing');
    } else if (analyzeStatus === 'completed' && analyzeResult) {
      setStage('results');
      // 自动生成脚本
      if (analyzeResult.ai_analysis) {
        generateScript(analyzeResult.ai_analysis);
      }
    }
  }, [analyzeStatus, analyzeResult, generateScript]);

  // 监听脚本生成完成
  useEffect(() => {
    if (scriptStatus === 'completed' && generatedScript) {
      setScript(generatedScript);
    }
  }, [scriptStatus, generatedScript]);

  // 监听视频生成状态
  useEffect(() => {
    if (videoStatus === 'starting' || videoStatus === 'processing') {
      setStage('generating-video');
    } else if (videoStatus === 'completed' && videoUrl) {
      setStage('video-ready');
    }
  }, [videoStatus, videoUrl]);

  // 处理分析
  const handleAnalyze = async () => {
    if (!url.trim()) return;
    await analyze(url);
  };

  // 处理重置
  const handleReset = () => {
    setUrl('');
    setStage('input');
    setScript(null);
    resetAnalyze();
    resetScript();
    resetVideo();
  };

  // 处理编辑脚本
  const handleEditScript = () => {
    setStage('editing');
  };

  // 处理返回结果
  const handleBackToResults = () => {
    setStage('results');
  };

  // 处理返回编辑器
  const handleBackToEditor = () => {
    setStage('editing');
  };

  // 处理生成视频
  const handleGenerateVideo = async () => {
    if (script) {
      await generateVideo(script);
    }
  };

  // 处理重新生成视频
  const handleRegenerateVideo = async () => {
    resetVideo();
    if (script) {
      await generateVideo(script);
    }
  };

  // 更新脚本
  const updateScript = (newScript: GeneratedScript) => {
    setScript(newScript);
  };

  // 将AI分析结果转换为SceneData格式
  const displayScenes: SceneData[] = useMemo(() => {
    if (!analyzeResult?.ai_analysis) return [];

    const generatedScenes: SceneData[] = [];
    let sceneNumber = 1;

    // 使用AI分析结果中的scenes
    if (analyzeResult.ai_analysis.scenes && analyzeResult.ai_analysis.scenes.length > 0) {
      return analyzeResult.ai_analysis.scenes.map((scene, index) => ({
        id: String(index + 1),
        number: index + 1,
        type: scene.type || 'hook',
        duration: scene.timestamp || `${index * 5}-${(index + 1) * 5}s`,
        script: scene.description || '',
      }));
    }

    // 从分析数据构建scenes
    if (analyzeResult.ai_analysis.hooks && analyzeResult.ai_analysis.hooks.length > 0) {
      generatedScenes.push({
        id: String(sceneNumber),
        number: sceneNumber,
        type: 'hook',
        duration: '0-3s',
        script: analyzeResult.ai_analysis.hooks[0],
      });
      sceneNumber++;
    }

    if (analyzeResult.ai_analysis.pain_points && analyzeResult.ai_analysis.pain_points.length > 0) {
      generatedScenes.push({
        id: String(sceneNumber),
        number: sceneNumber,
        type: 'pain',
        duration: '3-10s',
        script: analyzeResult.ai_analysis.pain_points[0],
      });
      sceneNumber++;
    }

    if (analyzeResult.ai_analysis.solutions && analyzeResult.ai_analysis.solutions.length > 0) {
      generatedScenes.push({
        id: String(sceneNumber),
        number: sceneNumber,
        type: 'solution',
        duration: '10-20s',
        script: analyzeResult.ai_analysis.solutions[0],
      });
      sceneNumber++;
    }

    if (analyzeResult.ai_analysis.cta) {
      generatedScenes.push({
        id: String(sceneNumber),
        number: sceneNumber,
        type: 'cta',
        duration: '25-30s',
        script: analyzeResult.ai_analysis.cta,
      });
    }

    return generatedScenes;
  }, [analyzeResult]);

  // 从视频信息构建统计数据
  const stats = useMemo(() => {
    if (!analyzeResult?.video_info?.stats) {
      return [
        { label: 'Views', value: 0, color: '#ffffff' },
        { label: 'Likes', value: 0, color: '#22d3ee' },
        { label: 'Shares', value: 0, color: '#3b82f6' },
        { label: 'Comments', value: 0, color: '#71717a' },
      ];
    }

    const videoStats = analyzeResult.video_info.stats;
    return [
      { label: 'Views', value: videoStats.views || 0, color: '#ffffff' },
      { label: 'Likes', value: videoStats.likes || 0, color: '#22d3ee' },
      { label: 'Shares', value: videoStats.shares || 0, color: '#3b82f6' },
      { label: 'Comments', value: videoStats.comments || 0, color: '#71717a' },
    ];
  }, [analyzeResult]);

  // 格式化视频时长
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 合并错误信息
  const error = analyzeError || scriptError || videoError;

  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-24 min-h-[80vh]', section.className, className)}
    >
      <div className="container mx-auto px-4">
        {/* Input Stage */}
        {showInput && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                <span>{section.label || 'AI-Powered Analysis'}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                {section.title || 'Analyze TikTok Videos'}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {section.description || 'Paste a TikTok video URL to get AI-driven deep analysis and insights'}
              </p>
            </div>

            {/* Input Card */}
            <GlassPanel className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Analyze TikTok Video</span>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="Paste TikTok video URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-base bg-background/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !url.trim()}
                  size="lg"
                  className="h-12 px-8"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Processing Status */}
              {isAnalyzing && (
                <div className="mt-4 text-muted-foreground text-sm">
                  AI is analyzing your video... This may take up to 2 minutes.
                </div>
              )}
            </GlassPanel>

            {/* Features */}
            {section.items && section.items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {section.items.map((item, idx) => (
                  <GlassPanel key={idx} className="p-6" variant="hover">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </GlassPanel>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Stage - V7/V8 Left-Right Layout */}
        {showResults && analyzeResult && (
          <>
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  New Analysis
                </button>
                <span className="text-sm text-muted-foreground truncate max-w-md">
                  {url}
                </span>
              </div>
              <button
                onClick={handleEditScript}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Script
              </button>
            </div>

            <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left: Video Preview & Stats */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <VideoPreview
                  thumbnailUrl={analyzeResult.video_info?.thumbnail_url}
                  videoUrl={analyzeResult.video_info?.video_url}
                  duration={formatDuration(analyzeResult.video_info?.duration)}
                  isLive={false}
                />
                <StatsGrid stats={stats} />

                {/* Video Info */}
                {analyzeResult.video_info && (
                  <GlassPanel className="p-4">
                    <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-2">
                      {analyzeResult.video_info.title || 'Untitled Video'}
                    </h3>
                    {analyzeResult.video_info.author && (
                      <p className="text-xs text-muted-foreground">
                        By @{analyzeResult.video_info.author.nickname}
                      </p>
                    )}
                  </GlassPanel>
                )}
              </div>

              {/* Right: Script Timeline */}
              <div className="lg:col-span-8">
                <GlassPanel className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Script Breakdown</h2>
                    <button
                      onClick={handleEditScript}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Video
                    </button>
                  </div>
                  <ScriptTimeline scenes={displayScenes} />
                </GlassPanel>

                {/* AI Summary */}
                {analyzeResult.ai_analysis?.summary && (
                  <GlassPanel className="p-6 mt-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      AI Summary
                    </h3>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      {analyzeResult.ai_analysis.summary}
                    </p>
                  </GlassPanel>
                )}
              </div>
            </div>
          </>
        )}

        {/* Editor Stage */}
        {showEditor && script && (
          <>
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToResults}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Analysis
                </button>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Start Over
              </button>
            </div>

            <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left: Video Preview */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <VideoPreview
                  thumbnailUrl={analyzeResult?.video_info?.thumbnail_url}
                  videoUrl={analyzeResult?.video_info?.video_url}
                  duration={formatDuration(analyzeResult?.video_info?.duration)}
                  isLive={false}
                />
                <StatsGrid stats={stats} />
              </div>

              {/* Right: Script Editor */}
              <div className="lg:col-span-8">
                <GlassPanel className="p-8">
                  <ScriptEditor
                    script={script}
                    onScriptChange={updateScript}
                    onGenerateVideo={handleGenerateVideo}
                    isGeneratingVideo={videoStatus === 'starting' || videoStatus === 'processing'}
                  />
                </GlassPanel>
              </div>
            </div>
          </>
        )}

        {/* Video Generation in Progress */}
        {showVideoGenerating && (
          <>
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToEditor}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Editor
                </button>
              </div>
            </div>

            <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            <div className="max-w-2xl mx-auto">
              <GlassPanel className="p-12 text-center">
                <div className="mb-8">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-border" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-foreground border-t-transparent animate-spin"
                      style={{ animationDuration: '1.5s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">{videoProgress}%</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Generating Your Video
                </h2>
                <p className="text-muted-foreground mb-8">
                  AI is creating your video based on the script. This may take 3-5 minutes.
                </p>

                {/* Progress Steps */}
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <div className={`flex items-center gap-3 ${videoProgress >= 10 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${videoProgress >= 10 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Processing script...</span>
                  </div>
                  <div className={`flex items-center gap-3 ${videoProgress >= 30 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${videoProgress >= 30 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Generating scenes...</span>
                  </div>
                  <div className={`flex items-center gap-3 ${videoProgress >= 60 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${videoProgress >= 60 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Adding audio...</span>
                  </div>
                  <div className={`flex items-center gap-3 ${videoProgress >= 90 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${videoProgress >= 90 ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="text-sm">Finalizing video...</span>
                  </div>
                </div>

                {/* Error display */}
                {videoError && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{videoError}</span>
                  </div>
                )}
              </GlassPanel>
            </div>
          </>
        )}

        {/* Video Ready Stage */}
        {showVideoReady && videoUrl && (
          <>
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToEditor}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Editor
                </button>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Analyze New Video
              </button>
            </div>

            <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left: Original Video Info */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <GlassPanel className="p-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Original Video
                  </h3>
                  <VideoPreview
                    thumbnailUrl={analyzeResult?.video_info?.thumbnail_url}
                    videoUrl={analyzeResult?.video_info?.video_url}
                    duration={formatDuration(analyzeResult?.video_info?.duration)}
                    isLive={false}
                    className="border-0 shadow-none"
                  />
                </GlassPanel>
                <StatsGrid stats={stats} />
              </div>

              {/* Right: Generated Video Result */}
              <div className="lg:col-span-8">
                <GlassPanel className="p-8">
                  <VideoResult
                    videoUrl={videoUrl}
                    thumbnailUrl={analyzeResult?.video_info?.thumbnail_url}
                    title={script?.title || 'Generated Video'}
                    duration={script?.total_duration}
                    onRegenerate={handleRegenerateVideo}
                    onStartOver={handleReset}
                    isRegenerating={videoStatus === 'starting' || videoStatus === 'processing'}
                  />
                </GlassPanel>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
