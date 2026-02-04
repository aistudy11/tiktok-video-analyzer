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

// ============================================
// Production Script Types (New Backend API)
// ============================================

/**
 * Video info in production script
 */
export interface ProductionVideoInfo {
  original_url: string;
  duration: number;
  author: string;
  title: string;
}

/**
 * Success formula analysis
 */
export interface SuccessFormula {
  hook_type: string;
  hook_description: string;
  content_structure: string;
  emotional_arc: string;
  key_success_factors: string[];
}

/**
 * Single shot in storyboard
 */
export interface StoryboardShot {
  shot_number: number;
  time_start: string;
  time_end: string;
  duration: number;
  shot_type: string;
  visual_description: string;
  script_text: string;
  action_description: string;
  camera_movement: string;
  transition: string;
  emotion: string;
  notes: string;
}

/**
 * Beat point for music sync
 */
export interface BeatPoint {
  time: string;
  action: string;
  description: string;
}

/**
 * Music beats info
 */
export interface MusicBeats {
  music_style: string;
  bpm_range: string;
  beat_points: BeatPoint[];
}

/**
 * Opening hook technique
 */
export interface OpeningHook {
  technique: string;
  example: string;
  how_to_adapt: string;
}

/**
 * Engagement trigger element
 */
export interface EngagementTrigger {
  trigger_type: string;
  original_example: string;
  adaptation_tip: string;
}

/**
 * Call to action element
 */
export interface CtaElement {
  cta_type: string;
  original_text: string;
  template: string;
}

/**
 * Reusable elements from video
 */
export interface ReusableElements {
  opening_hook: OpeningHook;
  engagement_triggers: EngagementTrigger[];
  call_to_action: CtaElement;
}

/**
 * Preparation step in production guide
 */
export interface PreparationStep {
  step: number;
  description: string;
  details: string;
}

/**
 * Production guide
 */
export interface ProductionGuide {
  equipment_needed: string[];
  preparation_steps: PreparationStep[];
  shooting_tips: string[];
  editing_tips: string[];
  estimated_production_time: string;
}

/**
 * Complete production script from backend
 */
export interface ProductionScript {
  script_version: string;
  video_info: ProductionVideoInfo;
  success_formula: SuccessFormula;
  storyboard: StoryboardShot[];
  music_beats: MusicBeats;
  reusable_elements: ReusableElements;
  production_guide: ProductionGuide;
}

/**
 * Production script generation request
 */
export interface ProductionScriptRequest {
  video_analysis_id: string;
  script_type: 'full' | 'simple';
  category?: string;
}

/**
 * Production script generation response
 */
export interface ProductionScriptResponse {
  task_id: string;
  video_analysis_id: string;
  status: string;
  script?: ProductionScript;
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Production script status for hook
 */
export type ProductionScriptStatus = 'idle' | 'generating' | 'completed' | 'failed';
