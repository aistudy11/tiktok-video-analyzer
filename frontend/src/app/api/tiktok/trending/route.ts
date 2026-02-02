/**
 * @fileoverview TikTok Trending Videos API
 * @input GET { cursor?: string, limit?: string }
 * @output { success: boolean, data?: { videos: [], hasMore: boolean }, error?: { code: string, message: string } }
 * @description Fetches trending TikTok videos from backend with pagination support
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

// Input validation schema
const trendingQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('20'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate input
    const parseResult = trendingQuerySchema.safeParse({
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid query parameters',
          },
        },
        { status: 400 }
      );
    }

    const { cursor, limit } = parseResult.data;

    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', limit);

    // Forward request to backend
    const response = await fetch(
      `${BACKEND_URL}/api/v1/trending/videos?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't cache trending videos - they should be fresh
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      // If endpoint doesn't exist yet, return empty list
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: {
            videos: [],
            hasMore: false,
            message: 'Trending videos endpoint not yet implemented in backend',
          },
        });
      }

      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: { code: 'BACKEND_ERROR', message: errorData.detail || 'Failed to fetch trending videos' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Backend service unavailable' } },
      { status: 500 }
    );
  }
}
