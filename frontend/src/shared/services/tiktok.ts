/**
 * TikTok API Service
 *
 * Centralized service for all TikTok-related API calls.
 * This service should be used by hooks instead of direct fetch calls.
 */

import type {
  TikTokVideo,
  TrendingVideosResponse,
  AnalysisResult,
  AIAnalysis,
  GeneratedScript,
  ScriptGenerationResponse,
  VideoGenerationResponse,
  VideoStatusResponse,
  ProductionScript,
  ProductionScriptResponse,
} from '@/types/tiktok';

// Re-export types for backward compatibility
export type {
  TikTokVideo,
  TrendingVideosResponse,
  ProductionScript,
  ProductionScriptResponse,
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.BACKEND_API_URL || 'http://localhost:8000';

export class TikTokService {
  private baseUrl: string;
  private frontendApiBase: string;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
    // Frontend API routes (Next.js API routes)
    this.frontendApiBase = '';
  }

  // ============================================
  // Video Analysis APIs
  // ============================================

  /**
   * Submit a video for analysis via frontend API
   * @param url TikTok video URL
   */
  async submitAnalysis(url: string): Promise<{ task_id: string }> {
    const response = await fetch(`${this.frontendApiBase}/api/tiktok/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to submit analysis');
    }

    return result.data;
  }

  /**
   * Get analysis task status via frontend API
   * @param taskId Task ID
   */
  async getAnalysisStatus(taskId: string): Promise<AnalysisResult> {
    const response = await fetch(`${this.frontendApiBase}/api/tiktok/status?task_id=${taskId}`);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to get analysis status');
    }

    return result.data;
  }

  /**
   * Cancel a pending task
   */
  async cancelTask(taskId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/task/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel task');
    }

    return response.json();
  }

  // ============================================
  // Script Generation APIs
  // ============================================

  /**
   * Generate a video script from analysis data
   * @param analysisData AI analysis result
   * @param useAI Whether to use AI for generation (defaults to true)
   */
  async generateScript(analysisData: AIAnalysis, useAI: boolean = true): Promise<GeneratedScript> {
    const response = await fetch(`${this.frontendApiBase}/api/tiktok/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis_data: {
          summary: analysisData.summary,
          hooks: analysisData.hooks,
          pain_points: analysisData.pain_points,
          solutions: analysisData.solutions,
          cta: analysisData.cta,
          target_audience: analysisData.target_audience,
          viral_elements: analysisData.viral_elements,
          improvement_suggestions: analysisData.improvement_suggestions,
          scenes: analysisData.scenes,
        },
        use_ai: useAI,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate script');
    }

    const data: ScriptGenerationResponse = await response.json();

    if (!data.success || !data.script) {
      throw new Error(data.error || 'Invalid response from script generation API');
    }

    return data.script;
  }

  // ============================================
  // Production Script APIs (New Backend)
  // ============================================

  /**
   * Generate a production script from video analysis
   * @param videoAnalysisId The task ID of completed video analysis
   * @param scriptType Type of script to generate (full or simple)
   */
  async generateProductionScript(
    videoAnalysisId: string,
    scriptType: 'full' | 'simple' = 'full'
  ): Promise<ProductionScriptResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_analysis_id: videoAnalysisId,
        script_type: scriptType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate production script');
    }

    return response.json();
  }

  /**
   * Get production script by video analysis ID
   * @param videoAnalysisId The task ID of video analysis
   */
  async getProductionScript(videoAnalysisId: string): Promise<ProductionScriptResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/script/${videoAnalysisId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Script not found');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get production script');
    }

    const data = await response.json();
    return {
      task_id: data.script_id,
      video_analysis_id: data.video_analysis_id,
      status: 'completed',
      script: data.script_data,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // ============================================
  // Video Generation APIs
  // ============================================

  /**
   * Start video generation from a script
   * @param script Generated script
   * @param userId Optional user ID
   */
  async generateVideo(script: GeneratedScript, userId?: string): Promise<{ task_id: string }> {
    const response = await fetch(`${this.frontendApiBase}/api/tiktok/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to start video generation');
    }

    const data: VideoGenerationResponse = await response.json();

    if (!data.task_id) {
      throw new Error('No task ID returned from video generation API');
    }

    return { task_id: data.task_id };
  }

  /**
   * Get video generation status
   * @param taskId Task ID
   */
  async getVideoStatus(taskId: string): Promise<VideoStatusResponse> {
    const response = await fetch(`${this.frontendApiBase}/api/tiktok/video-status?task_id=${taskId}`);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to get video status');
    }

    return result.data;
  }

  // ============================================
  // Trending Videos APIs
  // ============================================

  /**
   * Get trending videos
   * @param cursor Pagination cursor
   * @param limit Number of videos to fetch
   */
  async getTrendingVideos(
    cursor?: string,
    limit: number = 20
  ): Promise<TrendingVideosResponse> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', limit.toString());

    const response = await fetch(
      `${this.baseUrl}/api/v1/trending/videos?${params.toString()}`
    );

    if (!response.ok) {
      // Return empty response if endpoint not implemented yet
      if (response.status === 404) {
        return { videos: [], hasMore: false };
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get trending videos');
    }

    return response.json();
  }

  // ============================================
  // Health Check
  // ============================================

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error('Backend health check failed');
    }

    return response.json();
  }
}

// Export singleton instance for client-side use
export const tiktokService = new TikTokService();

// Server-side factory function
export function createTikTokService(baseUrl?: string): TikTokService {
  return new TikTokService(baseUrl);
}
