/**
 * @fileoverview Video Script Generation API
 * @input POST { analysis_data: ScriptGenerationInput, use_ai?: boolean }
 * @output { success: boolean, script?: GeneratedScript, error?: { code: string, message: string } }
 * @description Generates video scripts from analysis data using Gemini AI or fallback rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type {
  ScriptScene,
  GeneratedScript,
  ScriptGenerationInput,
  ScriptGenerationResponse,
} from '@/types/tiktok';

// Input validation schema for analysis scene
const analysisSceneSchema = z.object({
  timestamp: z.string(),
  type: z.string(),
  description: z.string(),
});

// Input validation schema for analysis data
const analysisDataSchema = z.object({
  summary: z.string().optional(),
  hooks: z.array(z.string()).optional(),
  pain_points: z.array(z.string()).optional(),
  solutions: z.array(z.string()).optional(),
  cta: z.string().optional(),
  target_audience: z.string().optional(),
  viral_elements: z.array(z.string()).optional(),
  improvement_suggestions: z.array(z.string()).optional(),
  scenes: z.array(analysisSceneSchema).optional(),
});

// Input validation schema for request body
const generateScriptRequestSchema = z.object({
  analysis_data: analysisDataSchema,
  use_ai: z.boolean().optional().default(true),
});

// 使用Gemini API生成脚本
async function generateScriptWithGemini(analysisData: ScriptGenerationInput): Promise<GeneratedScript> {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const prompt = buildScriptPrompt(analysisData);

  const response = await fetch(
    `${baseUrl}/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to generate script with Gemini');
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('No content generated from Gemini');
  }

  // 解析JSON响应
  const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                    textContent.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse script JSON from response');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const script = JSON.parse(jsonStr) as GeneratedScript;

  return script;
}

// 构建脚本生成提示词
function buildScriptPrompt(analysisData: ScriptGenerationInput): string {
  // 包含 improvement_suggestions 和 scenes 信息
  const improvementSuggestions = analysisData.improvement_suggestions?.join(', ') || 'N/A';
  const scenesInfo = analysisData.scenes?.map(s => `[${s.timestamp}] ${s.type}: ${s.description}`).join('\n') || 'N/A';

  return `You are an expert short-form video scriptwriter for e-commerce and TikTok content.

Based on the following video analysis, generate a structured video script for a new promotional video:

## Video Analysis Data:
- Summary: ${analysisData.summary || 'N/A'}
- Key Hooks: ${analysisData.hooks?.join(', ') || 'N/A'}
- Pain Points: ${analysisData.pain_points?.join(', ') || 'N/A'}
- Solutions: ${analysisData.solutions?.join(', ') || 'N/A'}
- Original CTA: ${analysisData.cta || 'N/A'}
- Target Audience: ${analysisData.target_audience || 'General audience'}
- Viral Elements: ${analysisData.viral_elements?.join(', ') || 'N/A'}
- Improvement Suggestions: ${improvementSuggestions}

## Original Video Scenes:
${scenesInfo}

## Requirements:
1. Create a 30-60 second video script
2. Include 4-6 scenes with specific timing
3. Each scene should have:
   - Scene number
   - Duration (e.g., "0-3s", "3-8s")
   - Type (hook, pain, solution, benefit, or cta)
   - Narration (what to say)
   - Visual description (what to show)
4. The script should follow the HOOK → PAIN → SOLUTION → BENEFIT → CTA structure
5. Make it engaging, authentic, and suitable for TikTok/short-form video
6. Incorporate the improvement suggestions where applicable

## Output Format:
Return ONLY valid JSON in this exact format:
\`\`\`json
{
  "title": "Video title",
  "total_duration": "30-45s",
  "scenes": [
    {
      "scene_number": 1,
      "duration": "0-3s",
      "type": "hook",
      "narration": "Attention-grabbing opening line",
      "visual_description": "Quick cut, product close-up",
      "notes": "Optional production notes"
    }
  ],
  "bgm_suggestion": "Upbeat trending sound",
  "cta": "Call to action text"
}
\`\`\``;
}

// 备用：使用简单规则生成脚本（无需AI）
function generateFallbackScript(analysisData: ScriptGenerationInput): GeneratedScript {
  const scenes: ScriptScene[] = [];
  let sceneNumber = 1;

  // Hook scene
  scenes.push({
    scene_number: sceneNumber++,
    duration: '0-3s',
    type: 'hook',
    narration: analysisData.hooks?.[0] || 'Did you know this product is going viral?',
    visual_description: 'Quick product reveal with dynamic camera movement',
    notes: 'Start with energy, grab attention immediately',
  });

  // Pain point scene
  if (analysisData.pain_points && analysisData.pain_points.length > 0) {
    scenes.push({
      scene_number: sceneNumber++,
      duration: '3-10s',
      type: 'pain',
      narration: analysisData.pain_points[0],
      visual_description: 'Show relatable problem scenario',
      notes: 'Connect emotionally with audience',
    });
  }

  // Solution scene
  if (analysisData.solutions && analysisData.solutions.length > 0) {
    scenes.push({
      scene_number: sceneNumber++,
      duration: '10-20s',
      type: 'solution',
      narration: analysisData.solutions[0],
      visual_description: 'Product demonstration solving the problem',
      notes: 'Focus on product features and benefits',
    });
  }

  // Benefit scene
  scenes.push({
    scene_number: sceneNumber++,
    duration: '20-25s',
    type: 'benefit',
    narration: 'See how easy it is? You\'ll wonder how you lived without it!',
    visual_description: 'Happy user enjoying the product benefits',
    notes: 'Show transformation and satisfaction',
  });

  // CTA scene
  scenes.push({
    scene_number: sceneNumber++,
    duration: '25-30s',
    type: 'cta',
    narration: analysisData.cta || 'Click the link below to get yours today!',
    visual_description: 'Product with price overlay, link prompt',
    notes: 'Create urgency, clear call to action',
  });

  return {
    title: 'Product Promotion Video',
    total_duration: '30s',
    scenes,
    bgm_suggestion: 'Trending upbeat sound or original audio',
    cta: analysisData.cta || 'Shop Now - Link in bio!',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = generateScriptRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Analysis data is required',
          },
        },
        { status: 400 }
      );
    }

    const { analysis_data, use_ai } = parseResult.data;

    let script: GeneratedScript;

    if (use_ai && process.env.GEMINI_API_KEY) {
      try {
        script = await generateScriptWithGemini(analysis_data as ScriptGenerationInput);
      } catch {
        script = generateFallbackScript(analysis_data as ScriptGenerationInput);
      }
    } else {
      script = generateFallbackScript(analysis_data as ScriptGenerationInput);
    }

    const response: ScriptGenerationResponse = {
      success: true,
      script,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate script' } },
      { status: 500 }
    );
  }
}
