// TikTok Video Analysis Types

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
  taskId: string;
  status: TaskStatus;
  message: string;
}

export interface TaskStatusResponse {
  taskId: string;
  status: TaskStatus;
  message?: string;
  progress?: number;
  result?: AnalysisResult;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus =
  | 'pending'
  | 'downloading'
  | 'analyzing'
  | 'syncing'
  | 'completed'
  | 'failed';

export interface AnalysisResult {
  videoInfo: {
    title?: string;
    author?: string;
    duration?: number;
    coverUrl?: string;
  };
  analysis: {
    summary?: string;
    themes?: string[];
    emotions?: string[];
    keyMoments?: KeyMoment[];
    recommendations?: string[];
  };
  transcription?: string;
  metadata?: Record<string, unknown>;
}

export interface KeyMoment {
  timestamp: number;
  description: string;
  importance?: 'high' | 'medium' | 'low';
}

export interface AnalysisHistoryItem {
  id: string;
  url: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  result?: AnalysisResult;
}
