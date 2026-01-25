// TikTok API Service - communicates with backend

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export interface TikTokVideo {
  id: string;
  url: string;
  title: string;
  description?: string;
  author: {
    id: string;
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
  videoUrl?: string;
  duration?: number;
  createTime?: number;
  hashtags?: string[];
}

export interface TrendingVideosResponse {
  videos: TikTokVideo[];
  cursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

export interface VideoAnalysisRequest {
  url: string;
  callbackUrl?: string;
  analysisPrompt?: string;
  syncToFeishu?: boolean;
}

export interface VideoAnalysisResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: string;
  message?: string;
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
}

export class TikTokService {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a new video analysis task
   */
  async analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create analysis task');
    }

    return response.json();
  }

  /**
   * Get the status of an analysis task
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/status/${taskId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get task status');
    }

    return response.json();
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

  /**
   * Get trending videos (placeholder - to be implemented in backend)
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
