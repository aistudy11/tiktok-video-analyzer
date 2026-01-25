'use client';

import { useState } from 'react';
import { BarChart3, Play, Loader2, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

interface AnalysisResult {
  task_id: string;
  status: string;
  result?: {
    title?: string;
    author?: string;
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    analysis?: string;
  };
}

export function TiktokAnalyzer({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('请输入 TikTok 视频链接');
      return;
    }

    if (!url.includes('tiktok.com')) {
      setError('请输入有效的 TikTok 视频链接');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/tiktok/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '分析请求失败');
      }

      setResult(data);

      // Poll for status if pending
      if (data.status === 'pending') {
        pollTaskStatus(data.task_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('分析超时，请稍后重试');
        return;
      }

      try {
        const response = await fetch(`/api/tiktok/status?task_id=${taskId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          setResult(data);
          return;
        } else if (data.status === 'failed') {
          setError(data.error || '分析失败');
          return;
        }

        attempts++;
        setTimeout(poll, 2000);
      } catch {
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  return (
    <section
      id={section.id}
      className={cn(
        'py-16 md:py-24',
        section.className,
        className
      )}
    >
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>{section.label || 'AI 驱动分析'}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {section.title || 'TikTok 视频分析'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {section.description || '粘贴 TikTok 视频链接，获取 AI 驱动的深度分析和洞察'}
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">分析 TikTok 视频</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="url"
              placeholder="粘贴 TikTok 视频链接..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-12 text-base"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              size="lg"
              className="h-12 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  开始分析
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>任务 ID: {result.task_id}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  result.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  result.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {result.status === 'completed' ? '已完成' :
                   result.status === 'pending' ? '处理中' : '失败'}
                </span>
              </div>

              {result.result && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Eye} label="播放量" value={result.result.views} />
                  <StatCard icon={Heart} label="点赞" value={result.result.likes} />
                  <StatCard icon={MessageCircle} label="评论" value={result.result.comments} />
                  <StatCard icon={Share2} label="分享" value={result.result.shares} />
                </div>
              )}

              {result.result?.analysis && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">AI 分析</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {result.result.analysis}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        {section.items && section.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ElementType;
  label: string;
  value?: number;
}) {
  return (
    <div className="p-4 bg-muted rounded-lg text-center">
      <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
      <div className="text-2xl font-bold text-foreground">
        {value !== undefined ? formatNumber(value) : '-'}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
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
