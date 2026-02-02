/**
 * @fileoverview Video Generation API
 * @input POST { script: GeneratedScript, user_id?: string }
 * @output { success: boolean, task_id?: string, message?: string, error?: { code: string, message: string } }
 * @description Initiates video generation from script using Runway API (simulation mode when API key not configured)
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type {
  GeneratedScript,
  VideoTask,
  VideoGenerationResponse,
} from '@/types/tiktok';
import { getTask, setTask } from '@/lib/video-task-store';

// Placeholder for video storage URL - replace with actual storage URL when implementing Runway API
const VIDEO_STORAGE_BASE_URL = process.env.VIDEO_STORAGE_URL || 'https://placeholder.storage/videos';

// Input validation schema for script scene
const scriptSceneSchema = z.object({
  scene_number: z.number(),
  duration: z.string(),
  type: z.string(),
  narration: z.string(),
  visual_description: z.string(),
  notes: z.string().optional(),
});

// Input validation schema for generated script
const generatedScriptSchema = z.object({
  title: z.string(),
  total_duration: z.string(),
  scenes: z.array(scriptSceneSchema).min(1, 'Script must have at least one scene'),
  bgm_suggestion: z.string().optional(),
  cta: z.string().optional(),
});

// Input validation schema for request body
const generateVideoRequestSchema = z.object({
  script: generatedScriptSchema,
  user_id: z.string().optional(),
});

// 模拟视频生成进度
async function simulateVideoGeneration(taskId: string) {
  const task = getTask(taskId);
  if (!task) return;

  // 更新为处理中
  setTask(taskId, {
    ...task,
    status: 'processing',
    progress: 0,
  });

  // 模拟进度更新 (固定间隔，不使用随机值)
  const progressSteps = [10, 25, 40, 55, 70, 85, 95, 100];
  const STEP_INTERVAL_MS = 2500; // 固定2.5秒间隔

  for (const progress of progressSteps) {
    await new Promise(resolve => setTimeout(resolve, STEP_INTERVAL_MS));
    const currentTask = getTask(taskId);
    if (currentTask) {
      setTask(taskId, {
        ...currentTask,
        progress,
      });
    }
  }

  // 完成
  const finalTask = getTask(taskId);
  if (finalTask) {
    setTask(taskId, {
      ...finalTask,
      status: 'completed',
      progress: 100,
      video_url: `${VIDEO_STORAGE_BASE_URL}/${taskId}.mp4`,
    });
  }
}

// 调用Runway API生成视频（占位实现）
async function generateVideoWithRunway(_script: GeneratedScript): Promise<string> {
  const runwayApiKey = process.env.RUNWAY_API_KEY;

  if (!runwayApiKey) {
    // 如果没有配置Runway API，使用模拟模式
    return 'simulation';
  }

  // TODO: [RUNWAY-001] Implement Runway Gen-3 API integration
  // Blocked: Waiting for Runway Gen-3 API availability
  // const response = await fetch('https://api.runwayml.com/v1/generate', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${runwayApiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'gen-3',
  //     prompt: buildVideoPrompt(script),
  //   }),
  // });

  return 'simulation';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = generateVideoRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Valid script with scenes is required',
          },
        },
        { status: 400 }
      );
    }

    const { script, user_id } = parseResult.data;

    // 检查用户余额（可选，根据实际需求）
    // const credits = await checkUserCredits(user_id);
    // if (credits < VIDEO_GENERATION_COST) {
    //   return NextResponse.json(
    //     { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Insufficient credits' } },
    //     { status: 402 }
    //   );
    // }

    // 创建任务ID
    const taskId = uuidv4();

    // 存储任务到共享存储
    const videoTask: VideoTask = {
      status: 'pending',
      progress: 0,
      created_at: Date.now(),
      script: script as GeneratedScript,
    };
    setTask(taskId, videoTask);

    // 尝试调用Runway API或使用模拟
    const mode = await generateVideoWithRunway(script as GeneratedScript);

    if (mode === 'simulation') {
      // 异步模拟视频生成
      simulateVideoGeneration(taskId);
    }

    const response: VideoGenerationResponse = {
      success: true,
      task_id: taskId,
      message: 'Video generation started',
      estimated_time: '3-5 minutes',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start video generation' } },
      { status: 500 }
    );
  }
}
