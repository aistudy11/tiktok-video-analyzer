/**
 * @fileoverview TikTok video preview player component
 * @input Props: thumbnailUrl, videoUrl, duration, isLive
 * @output Renders video thumbnail with play/pause controls
 * @pos Used in analysis results to preview original TikTok video
 */

'use client';

import { useState, useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from '../glass-panel';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPreviewProps {
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: string;
  isLive?: boolean;
  className?: string;
}

export function VideoPreview({
  thumbnailUrl,
  videoUrl,
  duration,
  isLive = false,
  className,
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Default placeholder image
  const defaultThumbnail = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%231a1a1a" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" font-size="48" text-anchor="middle" dominant-baseline="middle"%3EN%3C/text%3E%3C/svg%3E';

  return (
    <GlassPanel className={cn('overflow-hidden relative p-2', className)}>
      <div
        className="relative aspect-[9/16] bg-black/60 rounded-[14px] overflow-hidden group cursor-pointer"
        onClick={videoUrl ? handlePlayPause : undefined}
      >
        {/* Video element (hidden when not playing or no URL) */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              !isPlaying && 'hidden'
            )}
            muted={isMuted}
            playsInline
            loop
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Thumbnail (shown when not playing) */}
        {!isPlaying && (
          <img
            src={thumbnailUrl || defaultThumbnail}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
            onError={(e) => {
              // Fallback to default thumbnail on error
              (e.target as HTMLImageElement).src = defaultThumbnail;
            }}
          />
        )}

        {/* Play/Pause button overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity',
          isPlaying && 'opacity-0 hover:opacity-100'
        )}>
          <div className="w-16 h-16 rounded-full bg-foreground/5 backdrop-blur-sm flex items-center justify-center border border-foreground/20 hover:bg-foreground/20 transition-all hover:scale-105">
            {isPlaying ? (
              <Pause className="w-6 h-6 text-foreground" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 text-foreground translate-x-0.5" fill="currentColor" />
            )}
          </div>
        </div>

        {/* Mute toggle (when video is playing) */}
        {isPlaying && (
          <button
            onClick={handleMuteToggle}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
        )}

        {/* Bottom info bar */}
        {(isLive || duration) && (
          <div className="absolute inset-x-4 bottom-4">
            <GlassPanel className="p-3 backdrop-blur-md">
              <div className="flex justify-between items-center text-xs font-mono">
                {isLive && <span className="text-cyan-400">● LIVE</span>}
                {duration && <span className="text-foreground/60">{duration}</span>}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* No video available indicator */}
        {!videoUrl && !thumbnailUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-foreground/40 text-sm">Video not available</span>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
