/**
 * @fileoverview Video generation hook with progress tracking
 * @input GeneratedScript from script editor
 * @output Hook: { status, progress, videoUrl, error, generateVideo, reset }
 * @pos Manages video generation workflow with Runway API (simulation mode)
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { tiktokService } from '@/shared/services/tiktok';
import type {
  VideoGenerationStatus,
  VideoStatusResponse,
  GeneratedScript,
} from '@/types/tiktok';

// Re-export types for backward compatibility
export type { VideoGenerationStatus };

// 视频生成结果类型 (for backward compatibility)
export interface VideoGenerationResult {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  video_url?: string;
  error?: string;
}

// Hook返回类型
export interface UseVideoGeneratorReturn {
  status: VideoGenerationStatus;
  progress: number;
  videoUrl: string | null;
  error: string | null;
  generateVideo: (script: GeneratedScript) => Promise<string | null>;
  reset: () => void;
}

const POLLING_INTERVAL = 3000; // 3秒轮询
const MAX_POLLING_ATTEMPTS = 120; // 最多轮询120次（6分钟）

export function useVideoGenerator(): UseVideoGeneratorReturn {
  const [status, setStatus] = useState<VideoGenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  // 清理轮询
  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    attemptsRef.current = 0;
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  const reset = useCallback(() => {
    clearPolling();
    setStatus('idle');
    setProgress(0);
    setVideoUrl(null);
    setError(null);
  }, [clearPolling]);

  // 轮询视频生成状态
  const pollVideoStatus = useCallback(async (taskId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const data: VideoStatusResponse = await tiktokService.getVideoStatus(taskId);

          // 更新进度
          setProgress(data.progress || 0);

          if (data.status === 'completed' && data.video_url) {
            clearPolling();
            resolve(data.video_url);
            return;
          }

          if (data.status === 'failed') {
            clearPolling();
            reject(new Error(data.error || 'Video generation failed'));
            return;
          }

          attemptsRef.current++;
          if (attemptsRef.current >= MAX_POLLING_ATTEMPTS) {
            clearPolling();
            reject(new Error('Video generation timeout'));
            return;
          }

          // 继续轮询
          pollingRef.current = setTimeout(poll, POLLING_INTERVAL);
        } catch (err) {
          clearPolling();
          reject(err);
        }
      };

      poll();
    });
  }, [clearPolling]);

  const generateVideo = useCallback(async (script: GeneratedScript): Promise<string | null> => {
    setStatus('starting');
    setError(null);
    setProgress(0);
    setVideoUrl(null);

    try {
      // 提交视频生成任务
      const submitData = await tiktokService.generateVideo(script);
      const taskId = submitData.task_id;

      if (!taskId) {
        throw new Error('No task ID returned');
      }

      setStatus('processing');

      // 轮询获取结果
      const finalVideoUrl = await pollVideoStatus(taskId);

      setStatus('completed');
      setVideoUrl(finalVideoUrl);
      setProgress(100);

      return finalVideoUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus('failed');
      setError(errorMessage);
      return null;
    }
  }, [pollVideoStatus]);

  return {
    status,
    progress,
    videoUrl,
    error,
    generateVideo,
    reset,
  };
}
