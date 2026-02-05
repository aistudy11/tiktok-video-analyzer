/**
 * @fileoverview TikTok Video Analysis API
 * @input POST { url: string, callbackUrl?: string, analysisPrompt?: string, syncToFeishu?: boolean }
 * @output { success: boolean, data?: { task_id: string }, error?: { code: string, message: string } }
 * @description Forwards analysis requests to backend gateway for video download and AI analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

// Input validation schema
const analyzeRequestSchema = z.object({
  url: z.string().url('Invalid URL format').refine(
    (url) => url.includes('tiktok.com') || url.includes('vm.tiktok.com'),
    { message: 'URL must be a TikTok video URL' }
  ),
  callbackUrl: z.string().url().optional(),
  analysisPrompt: z.string().optional(),
  syncToFeishu: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = analyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid request body',
          },
        },
        { status: 400 }
      );
    }

    const { url, callbackUrl, analysisPrompt, syncToFeishu } = parseResult.data;

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        callback_url: callbackUrl,
        analysis_prompt: analysisPrompt,
        sync_to_feishu: syncToFeishu,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to create analysis task' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
