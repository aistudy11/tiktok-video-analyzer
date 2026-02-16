/**
 * @fileoverview Generated video result display component
 * @input Props: videoUrl, thumbnailUrl, title, duration, onRegenerate, onStartOver
 * @output Renders video player with download/share controls
 * @pos Final step UI showing generated video with playback and export options
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from '../glass-panel';
import {
  Play,
  Pause,
  Download,
  Share2,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface VideoResultProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  duration?: string;
  onRegenerate?: () => void;
  onStartOver?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export function VideoResult({
  videoUrl,
  thumbnailUrl,
  title = 'Generated Video',
  duration,
  onRegenerate,
  onStartOver,
  isRegenerating = false,
  className,
}: VideoResultProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCopied, setShowCopied] = useState(false);

  // 处理播放/暂停
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 处理静音
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // 处理全屏
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // 处理下载
  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // 如果fetch失败，直接打开链接
      window.open(videoUrl, '_blank');
    }
  };

  // 处理分享（复制链接）
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = videoUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  // 更新进度条
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Success Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Video Generated!</h2>
          <p className="text-sm text-muted-foreground">Your video is ready to download and share</p>
        </div>
      </div>

      {/* Video Player */}
      <GlassPanel className="overflow-hidden p-2">
        <div className="relative aspect-[9/16] max-h-[600px] bg-black rounded-xl overflow-hidden group">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            className="w-full h-full object-contain"
            playsInline
            onClick={togglePlay}
          />

          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
              onClick={togglePlay}
            >
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all hover:scale-105">
                <Play className="w-6 h-6 text-foreground translate-x-0.5" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <GlassPanel className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-foreground" />
                  ) : (
                    <Play className="w-5 h-5 text-foreground" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-foreground" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-foreground" />
                  )}
                </button>
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Maximize className="w-5 h-5 text-foreground" />
              </button>
            </GlassPanel>
          </div>
        </div>
      </GlassPanel>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-foreground text-background font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-foreground/5"
        >
          <Download className="w-5 h-5" />
          Download Video
        </button>

        <button
          onClick={handleShare}
          className="relative flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm transition-colors"
        >
          {showCopied ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              Copy Link
            </>
          )}
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', isRegenerating && 'animate-spin')} />
          {isRegenerating ? 'Regenerating...' : 'Regenerate Video'}
        </button>

        <button
          onClick={onStartOver}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Analyze New Video
        </button>
      </div>

      {/* Video Info */}
      <GlassPanel className="p-4">
        <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {duration && <span>Duration: {duration}</span>}
          <span>Format: MP4</span>
          <span>Quality: 1080p</span>
        </div>
      </GlassPanel>
    </div>
  );
}
