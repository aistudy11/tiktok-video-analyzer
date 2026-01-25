'use client';

import { useState } from 'react';
import { Loader2, Play, BarChart3, RefreshCw, ExternalLink } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-media';

interface TikTokVideo {
  id: string;
  url: string;
  title: string;
  description?: string;
  author: {
    uniqueId: string;
    nickname: string;
    avatarUrl?: string;
  };
  stats: {
    playCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
  coverUrl?: string;
}

interface AnalyzeState {
  loading: boolean;
  taskId?: string;
  status?: string;
  error?: string;
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

export function TikTokTrendingClient() {
  const [videoUrl, setVideoUrl] = useState('');
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>({ loading: false });
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const handleAnalyze = async (url: string) => {
    if (!url) return;

    setAnalyzeState({ loading: true });

    try {
      const response = await fetch('/api/tiktok/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create analysis task');
      }

      const data = await response.json();
      setAnalyzeState({
        loading: false,
        taskId: data.task_id,
        status: data.status,
      });
    } catch (error) {
      setAnalyzeState({
        loading: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
    }
  };

  const handleRefreshTrending = async () => {
    setLoadingVideos(true);
    try {
      const response = await fetch('/api/tiktok/trending');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to load trending videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* URL Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analyze TikTok Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="url"
              placeholder="Paste TikTok video URL here..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => handleAnalyze(videoUrl)}
              disabled={analyzeState.loading || !videoUrl}
            >
              {analyzeState.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {analyzeState.taskId && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                Task ID: <code className="font-mono">{analyzeState.taskId}</code>
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {analyzeState.status}
              </p>
            </div>
          )}

          {analyzeState.error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
              <p className="text-sm">{analyzeState.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Videos Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trending Videos</h2>
        <Button
          variant="outline"
          onClick={handleRefreshTrending}
          disabled={loadingVideos}
        >
          {loadingVideos ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {videos.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No trending videos available. Click Refresh to load videos from the backend.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onAnalyze={() => handleAnalyze(video.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({
  video,
  onAnalyze,
}: {
  video: TikTokVideo;
  onAnalyze: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[9/16] bg-muted">
        {video.coverUrl ? (
          <img
            src={video.coverUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          @{video.author.uniqueId}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{formatNumber(video.stats.playCount)} plays</Badge>
          <Badge variant="secondary">{formatNumber(video.stats.likeCount)} likes</Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <a href={video.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-3 w-3" />
            View
          </a>
        </Button>
        <Button size="sm" className="flex-1" onClick={onAnalyze}>
          <BarChart3 className="mr-2 h-3 w-3" />
          Analyze
        </Button>
      </CardFooter>
    </Card>
  );
}
