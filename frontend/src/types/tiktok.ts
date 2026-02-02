/**
 * TikTok Video Analyzer - Unified Type Definitions
 *
 * This file contains all shared types for TikTok video analysis,
 * script generation, and video generation features.
 */

// ============================================
// Video Analysis Types
// ============================================

/**
 * Video information extracted from TikTok
 */
export interface VideoInfo {
  title: string;
  description: string;
  duration: number;
  thumbnail_url: string;
  video_url?: string;
  author: {
    nickname: string;
    avatar_url?: string;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

/**
 * AI analysis result for a video
 */
export interface AIAnalysis {
  summary: string;
  hooks: string[];
  pain_points: string[];
  solutions: string[];
  cta: string;
  target_audience: string;
  viral_elements: string[];
  improvement_suggestions: string[];
  scenes?: AnalysisScene[];
}

/**
 * Scene extracted from video analysis
 */
export interface AnalysisScene {
  timestamp: string;
  description: string;
  type: SceneType;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  task_id: string;
  status: TaskStatus;
  video_info?: VideoInfo;
  ai_analysis?: AIAnalysis;
  error?: string;
}

// ============================================
// Script Generation Types
// ============================================

/**
 * Scene type for scripts
 */
export type SceneType = 'hook' | 'pain' | 'solution' | 'benefit' | 'cta';

/**
 * A single scene in a generated script
 */
export interface ScriptScene {
  scene_number: number;
  duration: string;
  type: SceneType;
  narration: string;
  visual_description: string;
  notes?: string;
}

/**
 * Generated video script
 */
export interface GeneratedScript {
  title: string;
  total_duration: string;
  scenes: ScriptScene[];
  bgm_suggestion: string;
  cta: string;
}

/**
 * Input data for script generation API
 */
export interface ScriptGenerationInput {
  summary?: string;
  hooks?: string[];
  pain_points?: string[];
  solutions?: string[];
  cta?: string;
  target_audience?: string;
  viral_elements?: string[];
  improvement_suggestions?: string[];
  scenes?: AnalysisScene[];
}

/**
 * Script generation API response
 */
export interface ScriptGenerationResponse {
  success: boolean;
  script?: GeneratedScript;
  error?: string;
}

// ============================================
// Video Generation Types
// ============================================

/**
 * Task status for async operations
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Video generation task stored in memory/database
 */
export interface VideoTask {
  status: TaskStatus;
  progress: number;
  video_url?: string;
  error?: string;
  created_at: number;
  script: GeneratedScript;
}

/**
 * Video generation API request
 */
export interface VideoGenerationRequest {
  script: GeneratedScript;
  user_id?: string;
}

/**
 * Video generation API response (initial)
 */
export interface VideoGenerationResponse {
  success: boolean;
  task_id: string;
  message: string;
  estimated_time: string;
}

/**
 * Video status API response
 */
export interface VideoStatusResponse {
  task_id: string;
  status: TaskStatus;
  progress: number;
  video_url?: string;
  error?: string;
  created_at?: number;
  message?: string;
}

// ============================================
// TikTok Service Types
// ============================================

/**
 * TikTok video data from API
 */
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

/**
 * Trending videos response
 */
export interface TrendingVideosResponse {
  videos: TikTokVideo[];
  cursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Video analysis request
 */
export interface VideoAnalysisRequest {
  url: string;
  callbackUrl?: string;
  analysisPrompt?: string;
  syncToFeishu?: boolean;
}

/**
 * Video analysis initial response
 */
export interface VideoAnalysisResponse {
  task_id: string;
  status: string;
  message: string;
}

/**
 * Task status response from backend
 */
export interface TaskStatusResponse {
  task_id: string;
  status: string;
  message?: string;
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
}

// ============================================
// Status Enums for Hooks
// ============================================

/**
 * Analysis status for useTiktokAnalyze hook
 */
export type AnalysisStatus = 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';

/**
 * Script generation status for useScriptGenerator hook
 */
export type ScriptGenerationStatus = 'idle' | 'generating' | 'completed' | 'failed';

/**
 * Video generation status for useVideoGenerator hook
 */
export type VideoGenerationStatus = 'idle' | 'starting' | 'processing' | 'completed' | 'failed';
