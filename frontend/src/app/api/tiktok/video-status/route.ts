/**
 * @fileoverview Video Generation Status API
 * @input GET { task_id: string }
 * @output { success: boolean, data?: VideoStatusResponse, error?: { code: string, message: string } }
 * @description Retrieves video generation task status and progress from in-memory store
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { VideoStatusResponse } from '@/types/tiktok';
import { getTask } from '@/lib/video-task-store';

// Input validation schema
const videoStatusQuerySchema = z.object({
  task_id: z.string().uuid('Invalid task ID format'),
});

// Default progress for tasks not yet in store
const DEFAULT_PENDING_PROGRESS = 5;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('task_id');

    // Validate input
    const parseResult = videoStatusQuerySchema.safeParse({ task_id: taskId });
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

    const validatedTaskId = parseResult.data.task_id;

    // 从共享存储获取任务状态
    const task = getTask(validatedTaskId);

    if (!task) {
      // 如果找不到任务，检查是否是新创建的任务（可能还没有被存储）
      // 返回固定的处理中状态作为降级方案
      const simulatedResponse: VideoStatusResponse = {
        task_id: validatedTaskId,
        status: 'processing',
        progress: DEFAULT_PENDING_PROGRESS,
        message: 'Video is being generated...',
      };

      return NextResponse.json({ success: true, data: simulatedResponse });
    }

    const response: VideoStatusResponse = {
      task_id: validatedTaskId,
      status: task.status,
      progress: task.progress,
      video_url: task.video_url,
      error: task.error,
      created_at: task.created_at,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get video status' } },
      { status: 500 }
    );
  }
}
