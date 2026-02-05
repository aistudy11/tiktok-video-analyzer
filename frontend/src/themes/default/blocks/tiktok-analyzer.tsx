'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3,
  Play,
  Loader2,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Wand2,
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
  VideoPreview,
  ScriptEditor,
  VideoResult,
} from './tiktok';

export function TiktokAnalyzer({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const [url, setUrl] = useState('');
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

  // Refs for scroll
  const resultsRef = useRef<HTMLDivElement>(null);
  const scriptEditorRef = useRef<HTMLDivElement>(null);
  const videoResultRef = useRef<HTMLDivElement>(null);

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
  const isScriptGenerating = scriptStatus === 'generating';
  const isVideoGenerating = videoStatus === 'starting' || videoStatus === 'processing';
  const hasResults = analyzeStatus === 'completed' && analyzeResult;
  const hasScript = script !== null;
  const hasGeneratedVideo = videoStatus === 'completed' && videoUrl;

  // 监听分析完成，自动生成脚本
  useEffect(() => {
    if (analyzeStatus === 'completed' && analyzeResult?.ai_analysis) {
      generateScript(analyzeResult.ai_analysis);
      // 滚动到结果区域
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [analyzeStatus, analyzeResult, generateScript]);

  // 监听脚本生成完成
  useEffect(() => {
    if (scriptStatus === 'completed' && generatedScript) {
      setScript(generatedScript);
    }
  }, [scriptStatus, generatedScript]);

  // 监听视频生成完成，滚动到视频区域
  useEffect(() => {
    if (videoStatus === 'completed' && videoUrl) {
      setTimeout(() => {
        videoResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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
    setScript(null);
    resetAnalyze();
    resetScript();
    resetVideo();
  };

  // 处理生成视频
  const handleGenerateVideo = async () => {
    if (script) {
      await generateVideo(script);
      // 滚动到视频生成区域
      setTimeout(() => {
        videoResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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
        {/* ========== 输入区域（始终显示） ========== */}
        <div className="max-w-4xl mx-auto mb-12">
          {/* Header - 只在未分析时显示完整标题 */}
          {!hasResults && (
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
          )}

          {/* Input Card */}
          <GlassPanel className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Analyze TikTok Video</span>
              </div>
              {hasResults && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Start New
                </button>
              )}
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
                    {hasResults ? 'Re-Analyze' : 'Start Analysis'}
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

          {/* Features - 只在未分析时显示 */}
          {!hasResults && section.items && section.items.length > 0 && (
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

        {/* ========== 结果区域（渐进式单页面） ========== */}
        {hasResults && analyzeResult && (
          <div ref={resultsRef} className="scroll-mt-8">
            <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* ========== 左侧固定区域：视频预览 + 统计 ========== */}
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

              {/* ========== 右侧滚动区域：分析 + 脚本编辑 + 视频生成 ========== */}
              <div className="lg:col-span-8 space-y-6">

                {/* ① AI 分析摘要（可折叠） */}
                <GlassPanel className="overflow-hidden">
                  <button
                    onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Wand2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg font-bold text-foreground">AI Analysis</h2>
                        <p className="text-sm text-muted-foreground">Insights and recommendations</p>
                      </div>
                    </div>
                    {isAnalysisExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {isAnalysisExpanded && analyzeResult.ai_analysis && (
                    <div className="px-6 pb-6 space-y-4">
                      <div className="border-t border-white/5 pt-4" />

                      {/* Summary */}
                      {analyzeResult.ai_analysis.summary && (
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Summary
                          </h3>
                          <p className="text-foreground/80 text-sm leading-relaxed">
                            {analyzeResult.ai_analysis.summary}
                          </p>
                        </div>
                      )}

                      {/* Viral Elements */}
                      {analyzeResult.ai_analysis.viral_elements && analyzeResult.ai_analysis.viral_elements.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Viral Elements
                          </h3>
                          <ul className="space-y-2">
                            {analyzeResult.ai_analysis.viral_elements.map((element, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                                <span className="text-primary mt-1">•</span>
                                <span>{element}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Target Audience */}
                      {analyzeResult.ai_analysis.target_audience && (
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Target Audience
                          </h3>
                          <p className="text-foreground/80 text-sm leading-relaxed">
                            {analyzeResult.ai_analysis.target_audience}
                          </p>
                        </div>
                      )}

                      {/* Improvement Suggestions */}
                      {analyzeResult.ai_analysis.improvement_suggestions && analyzeResult.ai_analysis.improvement_suggestions.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Improvement Suggestions
                          </h3>
                          <ul className="space-y-2">
                            {analyzeResult.ai_analysis.improvement_suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                                <span className="text-primary mt-1">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </GlassPanel>

                {/* ② 脚本编辑器（可折叠） */}
                <div ref={scriptEditorRef}>
                  <GlassPanel className="overflow-hidden">
                    <button
                      onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                      className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg font-bold text-foreground">Script Editor</h2>
                          <p className="text-sm text-muted-foreground">
                            {isScriptGenerating ? 'Generating script...' : hasScript ? `${script?.scenes?.length || 0} scenes • ${script?.total_duration || '30s'}` : 'Edit and customize your script'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isScriptGenerating && (
                          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                        )}
                        {isScriptExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isScriptExpanded && (
                      <div className="px-6 pb-6">
                        <div className="border-t border-white/5 pt-4" />

                        {isScriptGenerating ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Generating script from analysis...</p>
                          </div>
                        ) : hasScript && script ? (
                          <ScriptEditor
                            script={script}
                            onScriptChange={updateScript}
                            onGenerateVideo={handleGenerateVideo}
                            isGeneratingVideo={isVideoGenerating}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12">
                            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Script will appear here after generation</p>
                          </div>
                        )}
                      </div>
                    )}
                  </GlassPanel>
                </div>

                {/* ③ 视频生成区域 */}
                <div ref={videoResultRef}>
                  <GlassPanel className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Generated Video</h2>
                        <p className="text-sm text-muted-foreground">
                          {isVideoGenerating ? `Generating... ${videoProgress}%` : hasGeneratedVideo ? 'Your video is ready!' : 'Click "Generate Video" in script editor to start'}
                        </p>
                      </div>
                    </div>

                    {/* Video Generation Progress */}
                    {isVideoGenerating && (
                      <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="relative">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                              style={{ width: `${videoProgress}%` }}
                            />
                          </div>
                          <span className="absolute right-0 -top-6 text-sm font-medium text-foreground">
                            {videoProgress}%
                          </span>
                        </div>

                        {/* Progress Steps */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`text-center ${videoProgress >= 10 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${videoProgress >= 10 ? 'bg-green-500' : 'bg-muted'}`} />
                            <span className="text-xs">Processing</span>
                          </div>
                          <div className={`text-center ${videoProgress >= 30 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${videoProgress >= 30 ? 'bg-green-500' : 'bg-muted'}`} />
                            <span className="text-xs">Generating</span>
                          </div>
                          <div className={`text-center ${videoProgress >= 60 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${videoProgress >= 60 ? 'bg-green-500' : 'bg-muted'}`} />
                            <span className="text-xs">Audio</span>
                          </div>
                          <div className={`text-center ${videoProgress >= 90 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${videoProgress >= 90 ? 'bg-green-500' : 'bg-muted'}`} />
                            <span className="text-xs">Finalizing</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Generated Video Result */}
                    {hasGeneratedVideo && videoUrl && (
                      <VideoResult
                        videoUrl={videoUrl}
                        thumbnailUrl={analyzeResult?.video_info?.thumbnail_url}
                        title={script?.title || 'Generated Video'}
                        duration={script?.total_duration}
                        onRegenerate={handleRegenerateVideo}
                        onStartOver={handleReset}
                        isRegenerating={isVideoGenerating}
                      />
                    )}

                    {/* Empty State */}
                    {!isVideoGenerating && !hasGeneratedVideo && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                          <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-sm max-w-sm">
                          Edit your script above, then click the "Generate Video" button to create your AI-powered video.
                        </p>
                      </div>
                    )}

                    {/* Video Error */}
                    {videoError && (
                      <div className="mt-4 flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{videoError}</span>
                      </div>
                    )}
                  </GlassPanel>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
