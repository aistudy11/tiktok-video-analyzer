import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = searchParams.get('limit') || '20';

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
          videos: [],
          hasMore: false,
          message: 'Trending videos endpoint not yet implemented in backend',
        });
      }

      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch trending videos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('TikTok trending API error:', error);
    return NextResponse.json(
      {
        videos: [],
        hasMore: false,
        error: 'Backend service unavailable',
      },
      { status: 200 } // Return 200 with empty list to avoid breaking the UI
    );
  }
}
