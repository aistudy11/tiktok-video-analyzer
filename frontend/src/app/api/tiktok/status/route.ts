/**
 * @fileoverview TikTok Analysis Task Status API
 * @input GET { task_id: string }
 * @output { success: boolean, data?: { status: string, ai_analysis?: AIAnalysis, video_info?: VideoInfo }, error?: { code: string, message: string } }
 * @description Retrieves analysis task status and transforms backend response to frontend format
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  parseJsonString,
  transformAIAnalysis,
  transformVideoInfo,
} from '@/lib/tiktok-transformers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

// Input validation schema
const statusQuerySchema = z.object({
  task_id: z.string().min(1, 'Task ID is required'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('task_id') || searchParams.get('taskId');

    // Validate input
    const parseResult = statusQuerySchema.safeParse({ task_id: taskId });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Task ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/status/${taskId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to get task status' } },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform backend response to frontend-expected format
    if (data.status === 'completed' && data.result) {
      const result = data.result as Record<string, unknown>;

      // Parse and transform ai_analysis
      if (result.ai_analysis) {
        let parsedAnalysis: Record<string, unknown> | null = null;

        if (typeof result.ai_analysis === 'string') {
          parsedAnalysis = parseJsonString(result.ai_analysis);
        } else if (typeof result.ai_analysis === 'object') {
          parsedAnalysis = result.ai_analysis as Record<string, unknown>;
        }

        if (parsedAnalysis) {
          data.ai_analysis = transformAIAnalysis(parsedAnalysis);
        }
      }

      // Transform video_info from raw_metadata
      const videoPath = data.video_path as string | undefined;

      data.video_info = transformVideoInfo(result, BACKEND_URL, videoPath);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
