/**
 * @fileoverview TikTok data transformation utilities
 * @input Backend API responses (raw JSON)
 * @output Frontend-compatible data structures (AIAnalysis, VideoInfo)
 * @pos Shared transformers for TikTok API routes, decoupled from route handlers
 */

import type { AIAnalysis, VideoInfo } from '@/types/tiktok';

/**
 * Parse JSON string that may be wrapped in markdown code blocks
 * Handles AI responses that include ```json``` markers
 */
export function parseJsonString(jsonStr: string): Record<string, unknown> | null {
  let str = jsonStr.trim();

  // Remove markdown code block markers if present
  if (str.startsWith('```json')) {
    str = str.slice(7);
  } else if (str.startsWith('```')) {
    str = str.slice(3);
  }

  if (str.endsWith('```')) {
    str = str.slice(0, -3);
  }

  str = str.trim();

  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Transform backend AI analysis to frontend AIAnalysis interface
 * Maps backend field names to frontend expected format
 */
export function transformAIAnalysis(backendAnalysis: Record<string, unknown>): AIAnalysis {
  // Extract topics/viral_reason as viral_elements
  const viralElements: string[] = [];
  if (backendAnalysis.viral_reason && typeof backendAnalysis.viral_reason === 'string') {
    viralElements.push(backendAnalysis.viral_reason);
  }
  if (Array.isArray(backendAnalysis.topics)) {
    viralElements.push(...(backendAnalysis.topics as string[]));
  }

  // Map recommendations to improvement_suggestions
  const improvementSuggestions: string[] = [];
  if (Array.isArray(backendAnalysis.recommendations)) {
    improvementSuggestions.push(...(backendAnalysis.recommendations as string[]));
  }

  // Extract hooks from summary or ai_video_prompt
  const hooks: string[] = [];
  if (backendAnalysis.summary && typeof backendAnalysis.summary === 'string') {
    // Use first sentence as hook
    const firstSentence = (backendAnalysis.summary as string).split('.')[0];
    if (firstSentence) {
      hooks.push(firstSentence.trim() + '.');
    }
  }

  // Extract pain points from engagement_reason or create from context
  const painPoints: string[] = [];
  if (backendAnalysis.engagement_reason && typeof backendAnalysis.engagement_reason === 'string') {
    painPoints.push(backendAnalysis.engagement_reason as string);
  }

  // Extract solutions from cinematography or ai_video_prompt
  const solutions: string[] = [];
  if (backendAnalysis.cinematography && typeof backendAnalysis.cinematography === 'string') {
    solutions.push(backendAnalysis.cinematography as string);
  }

  // Extract CTA from marketing suggestions or create default
  let cta = 'Follow for more content like this!';
  if (backendAnalysis.marketing_value && typeof backendAnalysis.marketing_value === 'object') {
    const mv = backendAnalysis.marketing_value as Record<string, unknown>;
    if (Array.isArray(mv.integration_suggestions) && mv.integration_suggestions.length > 0) {
      cta = mv.integration_suggestions[0] as string;
    }
  }

  return {
    summary: (backendAnalysis.summary as string) || '',
    hooks,
    pain_points: painPoints,
    solutions,
    cta,
    target_audience: (backendAnalysis.target_audience as string) || '',
    viral_elements: viralElements,
    improvement_suggestions: improvementSuggestions,
    scenes: undefined, // Backend doesn't provide scene breakdown
  };
}

/**
 * Extract video filename from backend video_path
 * @example "/app/storage/videos/123456_789.mp4" -> "123456_789.mp4"
 */
export function extractVideoFilename(videoPath: string | undefined): string | undefined {
  if (!videoPath) return undefined;
  const parts = videoPath.split('/');
  return parts[parts.length - 1];
}

/**
 * Extract TikTok video ID from video_path and construct a TikTok URL
 * @example "/app/storage/videos/7583393741310905631_1769443262.mp4" -> "https://www.tiktok.com/video/7583393741310905631"
 */
export function extractTikTokUrlFromPath(videoPath: string | undefined): string | undefined {
  if (!videoPath) return undefined;
  const filename = extractVideoFilename(videoPath);
  if (!filename) return undefined;
  // Extract video ID (first number before underscore)
  const match = filename.match(/^(\d+)_/);
  if (match && match[1]) {
    return `https://www.tiktok.com/video/${match[1]}`;
  }
  return undefined;
}

/**
 * tikwm API response info
 */
export interface TikwmVideoInfo {
  videoUrl: string;
  thumbnailUrl: string;
}

/**
 * Transform backend raw_metadata to frontend VideoInfo interface
 * Handles multiple data sources with priority fallback
 */
export function transformVideoInfo(
  result: Record<string, unknown>,
  backendUrl: string,
  videoPath?: string,
  tikwmInfo?: TikwmVideoInfo | null
): VideoInfo | undefined {
  const rawMetadata = result.raw_metadata as Record<string, unknown> | undefined;

  // Try to get thumbnail_url from multiple sources (priority order):
  // 1. tikwm API response (freshest, most reliable)
  // 2. Backend metadata
  let thumbnailUrl = '';
  if (tikwmInfo?.thumbnailUrl) {
    thumbnailUrl = tikwmInfo.thumbnailUrl;
  } else if (rawMetadata?.thumbnail_url) {
    thumbnailUrl = rawMetadata.thumbnail_url as string;
  } else if (rawMetadata?.cover) {
    thumbnailUrl = rawMetadata.cover as string;
  }

  // Get video URL - try multiple sources in order of preference:
  // 1. tikwm API response (freshest, directly playable)
  // 2. Direct tikwm URL from backend metadata
  // 3. Constructed URL from video_path (requires backend /api/v1/video endpoint)
  let videoUrl = '';
  if (tikwmInfo?.videoUrl) {
    videoUrl = tikwmInfo.videoUrl;
  } else if (rawMetadata?.video_url && typeof rawMetadata.video_url === 'string' && rawMetadata.video_url.startsWith('http')) {
    videoUrl = rawMetadata.video_url;
  } else if (videoPath) {
    // Fallback: construct URL from video_path (requires backend /api/v1/video endpoint)
    const videoFilename = extractVideoFilename(videoPath);
    if (videoFilename) {
      videoUrl = `${backendUrl}/api/v1/video/${videoFilename}`;
    }
  }

  if (!rawMetadata) {
    // Try to construct from result fields
    if (!result.video_title && !result.author) {
      return undefined;
    }

    return {
      title: (result.video_title as string) || (result.description as string) || '',
      description: (result.description as string) || '',
      duration: (result.duration as number) || 0,
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
      author: {
        nickname: (result.author as string) || '',
        avatar_url: undefined,
      },
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      },
    };
  }

  return {
    title: (rawMetadata.title as string) || (result.video_title as string) || '',
    description: (rawMetadata.description as string) || (result.description as string) || '',
    duration: (rawMetadata.duration as number) || (result.duration as number) || 0,
    thumbnail_url: thumbnailUrl || (rawMetadata.thumbnail_url as string) || '',
    video_url: videoUrl || (rawMetadata.video_url as string) || '',
    author: {
      nickname: (rawMetadata.author as string) || (result.author as string) || '',
      avatar_url: undefined,
    },
    stats: {
      views: (rawMetadata.views as number) || 0,
      likes: (rawMetadata.likes as number) || 0,
      comments: (rawMetadata.comments as number) || 0,
      shares: (rawMetadata.shares as number) || 0,
    },
  };
}

/**
 * Fetch video and thumbnail URLs from tikwm API
 * Used as fallback when backend metadata doesn't have these URLs
 */
export async function fetchTikwmVideoInfo(
  tiktokUrl: string,
  tikwmApiUrl: string
): Promise<TikwmVideoInfo | null> {
  try {
    const response = await fetch(tikwmApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        url: tiktokUrl,
        hd: '1',
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.code !== 0 || !data.data) {
      return null;
    }

    const videoData = data.data;
    return {
      videoUrl: videoData.hdplay || videoData.play || '',
      thumbnailUrl: videoData.cover || videoData.origin_cover || '',
    };
  } catch {
    return null;
  }
}
