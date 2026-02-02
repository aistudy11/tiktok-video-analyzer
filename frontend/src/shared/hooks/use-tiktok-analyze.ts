/**
 * @fileoverview TikTok video analysis hook with polling
 * @input TikTok video URL
 * @output Hook: { status, result, error, analyze, reset }
 * @pos Manages analysis workflow: submit -> poll -> complete/fail
 */

'use client';

import { useState, useCallback } from 'react';
import { tiktokService } from '@/shared/services/tiktok';
import type {
  AnalysisStatus,
  AnalysisResult,
  VideoInfo,
  AIAnalysis,
} from '@/types/tiktok';

// Re-export types for backward compatibility
export type { AnalysisStatus, VideoInfo, AIAnalysis, AnalysisResult };

// Hook返回类型
export interface UseTiktokAnalyzeReturn {
  status: AnalysisStatus;
  result: AnalysisResult | null;
  error: string | null;
  analyze: (url: string) => Promise<AnalysisResult | null>;
  reset: () => void;
}

const POLLING_INTERVAL = 2000; // 2秒轮询
const MAX_POLLING_ATTEMPTS = 60; // 最多轮询60次（2分钟）

export function useTiktokAnalyze(): UseTiktokAnalyzeReturn {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  const pollStatus = useCallback(async (taskId: string): Promise<AnalysisResult> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const data = await tiktokService.getAnalysisStatus(taskId);

          if (data.status === 'completed') {
            resolve(data);
            return;
          }

          if (data.status === 'failed') {
            reject(new Error(data.error || 'Analysis failed'));
            return;
          }

          attempts++;
          if (attempts >= MAX_POLLING_ATTEMPTS) {
            reject(new Error('Analysis timeout'));
            return;
          }

          setTimeout(poll, POLLING_INTERVAL);
        } catch (err) {
          reject(err);
        }
      };

      poll();
    });
  }, []);

  const analyze = useCallback(async (url: string): Promise<AnalysisResult | null> => {
    if (!url.trim()) {
      setError('Please enter a TikTok URL');
      return null;
    }

    setStatus('submitting');
    setError(null);
    setResult(null);

    try {
      // 提交分析任务
      const submitData = await tiktokService.submitAnalysis(url);
      const taskId = submitData.task_id;

      if (!taskId) {
        throw new Error('No task ID returned');
      }

      setStatus('processing');

      // 轮询获取结果
      const finalResult = await pollStatus(taskId);

      setStatus('completed');
      setResult(finalResult);

      return finalResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus('failed');
      setError(errorMessage);
      return null;
    }
  }, [pollStatus]);

  return {
    status,
    result,
    error,
    analyze,
    reset,
  };
}
