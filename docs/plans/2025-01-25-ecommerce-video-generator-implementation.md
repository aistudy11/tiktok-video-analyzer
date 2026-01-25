# 跨境电商视频生成器 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 基于TikTok视频分析结果，实现"分析→脚本→视频"的完整产品闭环

**Architecture:**
- 后端新增脚本生成模块，调用Gemini API生成结构化脚本
- 后端新增视频生成模块，调用Runway API生成视频
- 前端新增脚本编辑器组件（简单文本编辑模式）
- 前端国际化基于现有next-intl框架扩展

**Tech Stack:** FastAPI, Celery, Gemini API, Runway API, Next.js, next-intl, TypeScript

---

## 开发前置条件

### 环境变量需求
```bash
# .env 新增
RUNWAY_API_KEY=your_runway_api_key
```

### 依赖安装
```bash
# 后端
pip install runway-python  # Runway SDK (如果有官方SDK)
# 或使用httpx直接调用API

# 前端 (已有next-intl)
pnpm add @tanstack/react-query  # 用于脚本编辑器状态管理(可选)
```

---

## 模块一：脚本生成模块（后端）

### Task 1.1: 创建脚本生成器基础结构

**Files:**
- Create: `backend/skills/script_generator/__init__.py`
- Create: `backend/skills/script_generator/generator.py`
- Create: `backend/skills/script_generator/prompts.py`
- Test: `backend/skills/script_generator/test_generator.py`

**Step 1: 创建模块初始化文件**

```python
# backend/skills/script_generator/__init__.py
from .generator import ScriptGenerator

__all__ = ["ScriptGenerator"]
```

**Step 2: 创建脚本提示词文件**

```python
# backend/skills/script_generator/prompts.py

SCRIPT_GENERATION_PROMPT_ZH = """你是一个专业的短视频脚本创作专家。基于以下视频分析结果，生成一个可直接使用的带货视频脚本。

## 分析结果
{analysis_result}

## 输出要求
请生成一个结构化的视频脚本，包含以下元素：

1. **脚本标题** - 简洁有吸引力
2. **总时长** - 建议60秒内
3. **分镜场景** - 每个场景包含：
   - 场景编号
   - 时长（如"0-3秒"）
   - 场景类型（hook/problem/solution/benefit/cta）
   - 旁白/台词
   - 画面描述
   - 拍摄建议

4. **BGM建议** - 推荐的背景音乐风格
5. **CTA（行动号召）** - 引导用户的话术

请用JSON格式输出：
```json
{
  "title": "脚本标题",
  "total_duration": "60秒",
  "scenes": [
    {
      "scene_number": 1,
      "duration": "0-3秒",
      "type": "hook",
      "narration": "开场话术...",
      "visual_description": "画面描述...",
      "notes": "拍摄建议..."
    }
  ],
  "bgm_suggestion": "节奏感强的电子音乐",
  "cta": "关注+购买引导"
}
```
"""

SCRIPT_GENERATION_PROMPT_EN = """You are a professional short video script creator. Based on the following video analysis results, generate a ready-to-use product promotion video script.

## Analysis Results
{analysis_result}

## Output Requirements
Please generate a structured video script with the following elements:

1. **Script Title** - Concise and attractive
2. **Total Duration** - Recommended under 60 seconds
3. **Scene Breakdown** - Each scene includes:
   - Scene number
   - Duration (e.g., "0-3s")
   - Scene type (hook/problem/solution/benefit/cta)
   - Narration/dialogue
   - Visual description
   - Shooting tips

4. **BGM Suggestion** - Recommended background music style
5. **CTA (Call to Action)** - User guidance

Please output in JSON format:
```json
{
  "title": "Script Title",
  "total_duration": "60s",
  "scenes": [
    {
      "scene_number": 1,
      "duration": "0-3s",
      "type": "hook",
      "narration": "Opening hook...",
      "visual_description": "Visual description...",
      "notes": "Shooting tips..."
    }
  ],
  "bgm_suggestion": "Upbeat electronic music",
  "cta": "Follow + purchase guidance"
}
```
"""

def get_script_prompt(language: str = "zh") -> str:
    """Get script generation prompt by language"""
    if language == "en":
        return SCRIPT_GENERATION_PROMPT_EN
    return SCRIPT_GENERATION_PROMPT_ZH
```

**Step 3: 创建脚本生成器**

```python
# backend/skills/script_generator/generator.py
import json
import logging
from typing import Dict, Any, Optional

from skills.ai_analysis.analyze import GeminiVideoAnalyzer
from .prompts import get_script_prompt

logger = logging.getLogger(__name__)


class ScriptGenerator:
    """Generate video scripts from analysis results"""

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-2.0-flash-exp",
        base_url: str = "https://api.apimart.ai"
    ):
        self.analyzer = GeminiVideoAnalyzer(
            api_key=api_key,
            model_name=model_name,
            base_url=base_url
        )

    def generate(
        self,
        analysis_result: Dict[str, Any],
        language: str = "zh",
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate video script from analysis result

        Args:
            analysis_result: AI analysis result dict
            language: Output language (zh/en)
            custom_prompt: Optional custom prompt

        Returns:
            Dict with script data or error
        """
        try:
            # Build prompt
            prompt = custom_prompt or get_script_prompt(language)
            prompt = prompt.format(analysis_result=json.dumps(analysis_result, ensure_ascii=False, indent=2))

            # Call Gemini
            result = self.analyzer.analyze_text(
                text="",
                system_prompt=prompt
            )

            if not result.get("success"):
                return {
                    "success": False,
                    "error": result.get("error", "Script generation failed")
                }

            # Parse script from response
            response_text = result.get("response", "")
            script = self._parse_script(response_text)

            if script:
                return {
                    "success": True,
                    "script": script,
                    "raw_response": response_text
                }

            return {
                "success": False,
                "error": "Failed to parse script from response",
                "raw_response": response_text
            }

        except Exception as e:
            logger.error(f"Script generation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _parse_script(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Parse script JSON from response"""
        import re

        # Try to extract JSON
        json_patterns = [
            r"```json\s*([\s\S]*?)\s*```",
            r"```\s*([\s\S]*?)\s*```",
            r"\{[\s\S]*\}"
        ]

        for pattern in json_patterns:
            match = re.search(pattern, response_text)
            if match:
                try:
                    json_str = match.group(1) if "```" in pattern else match.group(0)
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue

        return None
```

**Step 4: 创建测试文件**

```python
# backend/skills/script_generator/test_generator.py
import os
import json
import pytest
from unittest.mock import patch, MagicMock

from .generator import ScriptGenerator


class TestScriptGenerator:
    """Tests for ScriptGenerator"""

    @pytest.fixture
    def mock_analysis_result(self):
        return {
            "summary": "这是一个美妆产品展示视频",
            "viral_reason": "通过对比展示产品效果",
            "cinematography": "使用特写镜头展示细节",
            "ai_video_prompt": "Beauty product showcase with before/after comparison"
        }

    @pytest.fixture
    def generator(self):
        return ScriptGenerator(
            api_key="test_key",
            base_url="https://api.test.com"
        )

    def test_parse_script_valid_json(self, generator):
        """Test parsing valid JSON script"""
        response = '''
        Here is the script:
        ```json
        {
          "title": "Test Script",
          "total_duration": "60秒",
          "scenes": [
            {
              "scene_number": 1,
              "duration": "0-3秒",
              "type": "hook",
              "narration": "开场",
              "visual_description": "产品特写",
              "notes": "使用微距镜头"
            }
          ],
          "bgm_suggestion": "电子音乐",
          "cta": "点击购买"
        }
        ```
        '''

        script = generator._parse_script(response)
        assert script is not None
        assert script["title"] == "Test Script"
        assert len(script["scenes"]) == 1

    def test_parse_script_invalid_json(self, generator):
        """Test parsing invalid JSON returns None"""
        response = "This is not valid JSON"
        script = generator._parse_script(response)
        assert script is None

    @patch.object(ScriptGenerator, '_parse_script')
    def test_generate_success(self, mock_parse, generator, mock_analysis_result):
        """Test successful script generation"""
        mock_script = {
            "title": "Test",
            "scenes": [],
            "total_duration": "60秒"
        }
        mock_parse.return_value = mock_script

        # Mock the analyzer
        generator.analyzer.analyze_text = MagicMock(return_value={
            "success": True,
            "response": json.dumps(mock_script)
        })

        result = generator.generate(mock_analysis_result)

        assert result["success"] is True
        assert result["script"] == mock_script


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

**Step 5: 运行测试验证**

Run: `cd /Users/a11/MyCode/tiktok-video-analyzer/backend && python -m pytest skills/script_generator/test_generator.py -v`
Expected: All tests pass

**Step 6: Commit**

```bash
git add backend/skills/script_generator/
git commit -m "feat: add script generator module with prompts and tests"
```

---

### Task 1.2: 添加脚本生成API端点

**Files:**
- Modify: `backend/gateway/main.py` (添加新端点)
- Modify: `backend/gateway/models/task.py` (添加脚本模型)
- Modify: `backend/gateway/tasks/video_analysis.py` (集成脚本生成)

**Step 1: 在models/task.py添加脚本模型**

在 `backend/gateway/models/task.py` 文件末尾添加:

```python
class SceneScript(BaseModel):
    scene_number: int
    duration: str
    type: str  # hook/problem/solution/benefit/cta
    narration: str
    visual_description: str
    notes: Optional[str] = None


class VideoScript(BaseModel):
    title: str
    total_duration: str
    scenes: List[SceneScript]
    bgm_suggestion: Optional[str] = None
    cta: Optional[str] = None


class ScriptGenerationRequest(BaseModel):
    task_id: str = Field(..., description="Analysis task ID to generate script from")
    language: str = Field("zh", description="Output language: zh or en")
    custom_prompt: Optional[str] = Field(None, description="Custom prompt for script generation")


class ScriptGenerationResponse(BaseModel):
    success: bool
    script: Optional[VideoScript] = None
    error: Optional[str] = None
```

**Step 2: 在main.py添加脚本生成端点**

在 `backend/gateway/main.py` 的API端点部分添加:

```python
from skills.script_generator import ScriptGenerator

@app.post("/api/v1/generate-script", response_model=ScriptGenerationResponse)
async def generate_script(
    request: ScriptGenerationRequest,
    tm: TaskManager = Depends(get_task_manager)
):
    """
    Generate video script from completed analysis task.

    Requires a completed analysis task ID.
    """
    # Get task
    task = await tm.get_task(request.task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task {request.task_id} not found"
        )

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Task must be completed. Current status: {task.status}"
        )

    if not task.result:
        raise HTTPException(
            status_code=400,
            detail="Task has no analysis result"
        )

    # Generate script
    api_key = settings.GEMINI_API_KEY
    base_url = settings.GEMINI_BASE_URL

    generator = ScriptGenerator(
        api_key=api_key,
        base_url=base_url
    )

    # Build analysis result dict
    analysis_data = {
        "summary": task.result.content_summary or task.result.ai_analysis,
        "viral_reason": task.result.raw_metadata.get("viral_reason", ""),
        "cinematography": task.result.raw_metadata.get("cinematography", ""),
        "ai_video_prompt": task.result.raw_metadata.get("ai_video_prompt", ""),
        "topics": task.result.key_topics,
        "sentiment": task.result.sentiment,
    }

    result = generator.generate(
        analysis_result=analysis_data,
        language=request.language,
        custom_prompt=request.custom_prompt
    )

    if result["success"]:
        return ScriptGenerationResponse(
            success=True,
            script=VideoScript(**result["script"])
        )

    return ScriptGenerationResponse(
        success=False,
        error=result.get("error", "Script generation failed")
    )
```

**Step 3: 在models/__init__.py导出新模型**

在 `backend/gateway/models/__init__.py` 添加:

```python
from .task import (
    ...,
    SceneScript,
    VideoScript,
    ScriptGenerationRequest,
    ScriptGenerationResponse,
)
```

**Step 4: 手动测试API**

Run: `curl -X POST http://localhost:8000/api/v1/generate-script -H "Content-Type: application/json" -d '{"task_id": "test_task_id", "language": "zh"}'`
Expected: 返回错误提示task不存在（因为是测试）或返回脚本

**Step 5: Commit**

```bash
git add backend/gateway/main.py backend/gateway/models/
git commit -m "feat: add script generation API endpoint"
```

---

## 模块二：前端脚本编辑器

### Task 2.1: 创建脚本编辑器组件

**Files:**
- Create: `frontend/src/themes/default/blocks/script-editor.tsx`
- Create: `frontend/src/shared/types/script.ts`

**Step 1: 创建脚本类型定义**

```typescript
// frontend/src/shared/types/script.ts
export interface SceneScript {
  scene_number: number;
  duration: string;
  type: 'hook' | 'problem' | 'solution' | 'benefit' | 'cta';
  narration: string;
  visual_description: string;
  notes?: string;
}

export interface VideoScript {
  title: string;
  total_duration: string;
  scenes: SceneScript[];
  bgm_suggestion?: string;
  cta?: string;
}

export interface ScriptGenerationResponse {
  success: boolean;
  script?: VideoScript;
  error?: string;
}
```

**Step 2: 创建脚本编辑器组件**

```typescript
// frontend/src/themes/default/blocks/script-editor.tsx
'use client';

import { useState } from 'react';
import {
  Film,
  Plus,
  Trash2,
  Save,
  Download,
  ChevronDown,
  ChevronUp,
  Wand2,
  Loader2
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { VideoScript, SceneScript } from '@/shared/types/script';

const SCENE_TYPES = [
  { value: 'hook', label: 'Hook (开场)', color: 'bg-red-100 text-red-700' },
  { value: 'problem', label: '痛点', color: 'bg-orange-100 text-orange-700' },
  { value: 'solution', label: '解决方案', color: 'bg-green-100 text-green-700' },
  { value: 'benefit', label: '好处', color: 'bg-blue-100 text-blue-700' },
  { value: 'cta', label: 'CTA', color: 'bg-purple-100 text-purple-700' },
];

interface ScriptEditorProps {
  initialScript?: VideoScript;
  taskId: string;
  onGenerateVideo?: (script: VideoScript) => void;
  className?: string;
}

export function ScriptEditor({
  initialScript,
  taskId,
  onGenerateVideo,
  className,
}: ScriptEditorProps) {
  const [script, setScript] = useState<VideoScript>(
    initialScript || {
      title: '',
      total_duration: '60秒',
      scenes: [
        {
          scene_number: 1,
          duration: '0-3秒',
          type: 'hook',
          narration: '',
          visual_description: '',
          notes: '',
        },
      ],
      bgm_suggestion: '',
      cta: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set([0]));

  const handleGenerateScript = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/tiktok/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, language: 'zh' }),
      });

      const data = await response.json();
      if (data.success && data.script) {
        setScript(data.script);
        // Expand all scenes
        setExpandedScenes(new Set(data.script.scenes.map((_: SceneScript, i: number) => i)));
      }
    } catch (error) {
      console.error('Failed to generate script:', error);
    } finally {
      setGenerating(false);
    }
  };

  const updateScene = (index: number, updates: Partial<SceneScript>) => {
    const newScenes = [...script.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    setScript({ ...script, scenes: newScenes });
  };

  const addScene = () => {
    const newScene: SceneScript = {
      scene_number: script.scenes.length + 1,
      duration: '',
      type: 'solution',
      narration: '',
      visual_description: '',
      notes: '',
    };
    setScript({ ...script, scenes: [...script.scenes, newScene] });
    setExpandedScenes(new Set([...expandedScenes, script.scenes.length]));
  };

  const removeScene = (index: number) => {
    if (script.scenes.length <= 1) return;
    const newScenes = script.scenes.filter((_, i) => i !== index);
    // Renumber scenes
    newScenes.forEach((scene, i) => {
      scene.scene_number = i + 1;
    });
    setScript({ ...script, scenes: newScenes });
  };

  const toggleScene = (index: number) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedScenes(newExpanded);
  };

  const handleSave = () => {
    // Save to localStorage for now
    localStorage.setItem(`script_${taskId}`, JSON.stringify(script));
    alert('脚本已保存');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${script.title || 'untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('bg-card border border-border rounded-2xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">脚本编辑器</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateScript}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            AI生成脚本
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* Script Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          脚本标题
        </label>
        <Input
          value={script.title}
          onChange={(e) => setScript({ ...script, title: e.target.value })}
          placeholder="输入脚本标题..."
          className="text-lg font-medium"
        />
      </div>

      {/* Scenes */}
      <div className="space-y-4 mb-6">
        {script.scenes.map((scene, index) => {
          const sceneType = SCENE_TYPES.find((t) => t.value === scene.type);
          const isExpanded = expandedScenes.has(index);

          return (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Scene Header */}
              <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer"
                onClick={() => toggleScene(index)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    场景 {scene.scene_number}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      sceneType?.color
                    )}
                  >
                    {sceneType?.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {scene.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {script.scenes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScene(index);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Scene Content */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        场景类型
                      </label>
                      <select
                        value={scene.type}
                        onChange={(e) =>
                          updateScene(index, { type: e.target.value as SceneScript['type'] })
                        }
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        {SCENE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        时长
                      </label>
                      <Input
                        value={scene.duration}
                        onChange={(e) =>
                          updateScene(index, { duration: e.target.value })
                        }
                        placeholder="如: 0-3秒"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      旁白/台词
                    </label>
                    <Textarea
                      value={scene.narration}
                      onChange={(e) =>
                        updateScene(index, { narration: e.target.value })
                      }
                      placeholder="输入这个场景的旁白或台词..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      画面描述
                    </label>
                    <Textarea
                      value={scene.visual_description}
                      onChange={(e) =>
                        updateScene(index, { visual_description: e.target.value })
                      }
                      placeholder="描述这个场景的画面..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      拍摄建议
                    </label>
                    <Input
                      value={scene.notes || ''}
                      onChange={(e) =>
                        updateScene(index, { notes: e.target.value })
                      }
                      placeholder="拍摄角度、运镜等建议..."
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Scene Button */}
      <Button
        variant="outline"
        className="w-full mb-6"
        onClick={addScene}
      >
        <Plus className="w-4 h-4 mr-2" />
        添加场景
      </Button>

      {/* BGM & CTA */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            BGM建议
          </label>
          <Input
            value={script.bgm_suggestion || ''}
            onChange={(e) => setScript({ ...script, bgm_suggestion: e.target.value })}
            placeholder="背景音乐风格建议..."
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            CTA (行动号召)
          </label>
          <Input
            value={script.cta || ''}
            onChange={(e) => setScript({ ...script, cta: e.target.value })}
            placeholder="关注、购买引导..."
          />
        </div>
      </div>

      {/* Generate Video Button */}
      {onGenerateVideo && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => onGenerateVideo(script)}
          disabled={loading || !script.title || script.scenes.length === 0}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Film className="w-4 h-4 mr-2" />
          )}
          生成视频 ($1.5)
        </Button>
      )}
    </div>
  );
}
```

**Step 3: 运行构建验证**

Run: `cd /Users/a11/MyCode/tiktok-video-analyzer/frontend && pnpm build`
Expected: Build succeeds without TypeScript errors

**Step 4: Commit**

```bash
git add frontend/src/themes/default/blocks/script-editor.tsx frontend/src/shared/types/script.ts
git commit -m "feat: add script editor component with scene management"
```

---

### Task 2.2: 添加脚本生成API路由（前端）

**Files:**
- Create: `frontend/src/app/api/tiktok/generate-script/route.ts`

**Step 1: 创建API路由**

```typescript
// frontend/src/app/api/tiktok/generate-script/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Script generation failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/app/api/tiktok/generate-script/route.ts
git commit -m "feat: add frontend API route for script generation"
```

---

### Task 2.3: 集成脚本编辑器到分析结果页面

**Files:**
- Modify: `frontend/src/themes/default/blocks/tiktok-analyzer.tsx`

**Step 1: 在tiktok-analyzer.tsx中导入并添加脚本编辑器**

在文件顶部添加导入:
```typescript
import { ScriptEditor } from './script-editor';
```

在结果展示区域（`{result.result && ...}` 部分）后添加脚本编辑器:

```typescript
{/* Script Editor - Show when analysis is completed */}
{result.status === 'completed' && result.result && (
  <div className="mt-6">
    <ScriptEditor
      taskId={result.task_id}
      onGenerateVideo={(script) => {
        console.log('Generate video with script:', script);
        // TODO: Implement video generation
      }}
    />
  </div>
)}
```

**Step 2: 运行构建验证**

Run: `cd /Users/a11/MyCode/tiktok-video-analyzer/frontend && pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/themes/default/blocks/tiktok-analyzer.tsx
git commit -m "feat: integrate script editor into TikTok analyzer results"
```

---

## 模块三：视频生成模块（Runway API）

### Task 3.1: 创建视频生成器基础结构

**Files:**
- Create: `backend/skills/video_generator/__init__.py`
- Create: `backend/skills/video_generator/runway_client.py`
- Create: `backend/skills/video_generator/generator.py`

**Step 1: 创建模块初始化文件**

```python
# backend/skills/video_generator/__init__.py
from .generator import VideoGenerator
from .runway_client import RunwayClient

__all__ = ["VideoGenerator", "RunwayClient"]
```

**Step 2: 创建Runway客户端**

```python
# backend/skills/video_generator/runway_client.py
import logging
import time
from typing import Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)


class RunwayClient:
    """Client for Runway Gen-3 API"""

    BASE_URL = "https://api.runwayml.com/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-Runway-Version": "2024-11-06"
        }

    def generate_video(
        self,
        prompt: str,
        duration: int = 5,
        ratio: str = "9:16",
        model: str = "gen3a_turbo"
    ) -> Dict[str, Any]:
        """
        Generate video using Runway Gen-3 API

        Args:
            prompt: Text prompt for video generation
            duration: Video duration in seconds (5 or 10)
            ratio: Aspect ratio (16:9, 9:16, 1:1)
            model: Model to use (gen3a_turbo)

        Returns:
            Dict with task ID or error
        """
        try:
            url = f"{self.BASE_URL}/image_to_video"  # or text_to_video

            payload = {
                "model": model,
                "promptText": prompt,
                "duration": duration,
                "ratio": ratio,
            }

            with httpx.Client(timeout=60) as client:
                response = client.post(
                    url,
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            return {
                "success": True,
                "task_id": data.get("id"),
                "status": data.get("status")
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"Runway API error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"Runway API error: {e.response.status_code}"
            }
        except Exception as e:
            logger.error(f"Runway client error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get status of a video generation task"""
        try:
            url = f"{self.BASE_URL}/tasks/{task_id}"

            with httpx.Client(timeout=30) as client:
                response = client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()

            return {
                "success": True,
                "status": data.get("status"),
                "progress": data.get("progress", 0),
                "output_url": data.get("output", [{}])[0].get("url") if data.get("status") == "SUCCEEDED" else None,
                "error": data.get("error")
            }

        except Exception as e:
            logger.error(f"Failed to get task status: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def wait_for_completion(
        self,
        task_id: str,
        max_wait: int = 300,
        poll_interval: int = 5
    ) -> Dict[str, Any]:
        """Wait for video generation to complete"""
        start_time = time.time()

        while time.time() - start_time < max_wait:
            status = self.get_task_status(task_id)

            if not status["success"]:
                return status

            if status["status"] == "SUCCEEDED":
                return {
                    "success": True,
                    "video_url": status["output_url"]
                }

            if status["status"] == "FAILED":
                return {
                    "success": False,
                    "error": status.get("error", "Video generation failed")
                }

            time.sleep(poll_interval)

        return {
            "success": False,
            "error": "Timeout waiting for video generation"
        }
```

**Step 3: 创建视频生成器**

```python
# backend/skills/video_generator/generator.py
import logging
from typing import Dict, Any, List

from .runway_client import RunwayClient

logger = logging.getLogger(__name__)


class VideoGenerator:
    """Generate videos from scripts using Runway API"""

    def __init__(self, runway_api_key: str):
        self.client = RunwayClient(runway_api_key)

    def generate_from_script(
        self,
        script: Dict[str, Any],
        duration: int = 5,
        ratio: str = "9:16"
    ) -> Dict[str, Any]:
        """
        Generate video from a script

        For MVP, we generate a single video from the combined prompts
        Future: Generate per-scene and stitch together

        Args:
            script: VideoScript dict
            duration: Video duration
            ratio: Aspect ratio

        Returns:
            Dict with video URL or error
        """
        try:
            # Combine scene descriptions into a single prompt
            prompt = self._build_prompt_from_script(script)

            # Start generation
            result = self.client.generate_video(
                prompt=prompt,
                duration=duration,
                ratio=ratio
            )

            if not result["success"]:
                return result

            # Wait for completion
            return self.client.wait_for_completion(result["task_id"])

        except Exception as e:
            logger.error(f"Video generation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _build_prompt_from_script(self, script: Dict[str, Any]) -> str:
        """Build a video generation prompt from script"""
        scenes = script.get("scenes", [])

        if not scenes:
            return script.get("title", "A promotional video")

        # Combine visual descriptions
        descriptions = []
        for scene in scenes:
            desc = scene.get("visual_description", "")
            if desc:
                descriptions.append(desc)

        # Build prompt
        prompt_parts = [
            f"Create a {script.get('total_duration', '60 second')} promotional video.",
            f"Style: {script.get('bgm_suggestion', 'dynamic and engaging')}.",
            "Scenes:",
        ]

        for i, desc in enumerate(descriptions, 1):
            prompt_parts.append(f"- Scene {i}: {desc}")

        return " ".join(prompt_parts)

    def estimate_cost(self, duration: int = 5) -> float:
        """Estimate cost for video generation"""
        # Runway pricing: approximately $0.05/second
        return duration * 0.05
```

**Step 4: Commit**

```bash
git add backend/skills/video_generator/
git commit -m "feat: add video generator module with Runway API client"
```

---

### Task 3.2: 添加视频生成API端点

**Files:**
- Modify: `backend/gateway/main.py`
- Modify: `backend/gateway/models/task.py`
- Modify: `backend/gateway/config.py`

**Step 1: 在config.py添加Runway配置**

```python
# 在 backend/gateway/config.py 中添加
RUNWAY_API_KEY: str = os.environ.get("RUNWAY_API_KEY", "")
```

**Step 2: 在models/task.py添加视频生成模型**

```python
class VideoGenerationRequest(BaseModel):
    script: VideoScript = Field(..., description="Video script to generate from")
    duration: int = Field(5, description="Video duration in seconds (5 or 10)")
    ratio: str = Field("9:16", description="Aspect ratio (16:9, 9:16, 1:1)")


class VideoGenerationResponse(BaseModel):
    success: bool
    video_url: Optional[str] = None
    estimated_cost: Optional[float] = None
    error: Optional[str] = None
```

**Step 3: 在main.py添加视频生成端点**

```python
from skills.video_generator import VideoGenerator

@app.post("/api/v1/generate-video", response_model=VideoGenerationResponse)
async def generate_video(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate video from script using Runway API.

    This is a paid feature - cost approximately $0.05/second of video.
    """
    if not settings.RUNWAY_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Video generation service not configured"
        )

    generator = VideoGenerator(settings.RUNWAY_API_KEY)

    # Estimate cost
    cost = generator.estimate_cost(request.duration)

    # Generate video
    result = generator.generate_from_script(
        script=request.script.dict(),
        duration=request.duration,
        ratio=request.ratio
    )

    if result["success"]:
        return VideoGenerationResponse(
            success=True,
            video_url=result["video_url"],
            estimated_cost=cost
        )

    return VideoGenerationResponse(
        success=False,
        error=result.get("error", "Video generation failed"),
        estimated_cost=cost
    )
```

**Step 4: Commit**

```bash
git add backend/gateway/main.py backend/gateway/models/task.py backend/gateway/config.py
git commit -m "feat: add video generation API endpoint with Runway integration"
```

---

## 模块四：英语界面国际化

### Task 4.1: 创建TikTok分析器国际化文件

**Files:**
- Create: `frontend/src/config/locale/messages/en/pages/index.json` (修改)
- Create: `frontend/src/config/locale/messages/zh/pages/index.json` (修改)

**Step 1: 查看现有index.json结构并添加TikTok分析器文案**

首先读取现有文件结构，然后添加缺失的翻译键。

需要添加的翻译键:
```json
{
  "tiktok_analyzer": {
    "label": "AI Powered Analysis / AI 驱动分析",
    "title": "TikTok Video Analyzer / TikTok 视频分析",
    "description": "Paste a TikTok video link to get AI-powered analysis / 粘贴 TikTok 视频链接，获取 AI 驱动的深度分析",
    "analyze_button": "Analyze TikTok Video / 分析 TikTok 视频",
    "start_analysis": "Start Analysis / 开始分析",
    "analyzing": "Analyzing... / 分析中...",
    "task_id": "Task ID / 任务 ID",
    "status": {
      "completed": "Completed / 已完成",
      "downloading": "Downloading / 下载中",
      "analyzing": "Analyzing / 分析中",
      "syncing": "Syncing / 同步中",
      "failed": "Failed / 失败",
      "pending": "Pending / 排队中"
    },
    "stats": {
      "views": "Views / 播放量",
      "likes": "Likes / 点赞",
      "comments": "Comments / 评论",
      "shares": "Shares / 分享"
    },
    "analysis_complete": "Analysis Complete / 分析已完成",
    "full_report_synced": "Full report synced to Feishu / 完整报告已同步到飞书多维表格",
    "view_full_report": "View Full Report / 查看完整报告",
    "sentiment": "Sentiment / 情感倾向",
    "engagement_prediction": "Engagement Prediction / 互动预测",
    "ai_analysis_details": "AI Analysis Details / AI 分析详情",
    "errors": {
      "empty_url": "Please enter a TikTok video link / 请输入 TikTok 视频链接",
      "invalid_url": "Please enter a valid TikTok video link / 请输入有效的 TikTok 视频链接",
      "timeout": "Analysis timeout, please try again / 分析超时，请稍后重试",
      "failed": "Analysis failed, please try again / 分析失败，请稍后重试"
    }
  },
  "script_editor": {
    "title": "Script Editor / 脚本编辑器",
    "script_title": "Script Title / 脚本标题",
    "ai_generate": "AI Generate Script / AI生成脚本",
    "save": "Save / 保存",
    "export": "Export / 导出",
    "add_scene": "Add Scene / 添加场景",
    "scene": "Scene / 场景",
    "scene_type": "Scene Type / 场景类型",
    "duration": "Duration / 时长",
    "narration": "Narration / 旁白/台词",
    "visual_description": "Visual Description / 画面描述",
    "shooting_tips": "Shooting Tips / 拍摄建议",
    "bgm_suggestion": "BGM Suggestion / BGM建议",
    "cta": "CTA (Call to Action) / CTA (行动号召)",
    "generate_video": "Generate Video / 生成视频",
    "scene_types": {
      "hook": "Hook / 开场",
      "problem": "Problem / 痛点",
      "solution": "Solution / 解决方案",
      "benefit": "Benefit / 好处",
      "cta": "CTA"
    }
  }
}
```

**Step 2: 更新前端组件使用翻译**

修改 `tiktok-analyzer.tsx` 使用 `useTranslations` hook:

```typescript
import { useTranslations } from 'next-intl';

// 在组件内
const t = useTranslations('tiktok_analyzer');

// 使用翻译
<span>{t('label')}</span>
<h2>{t('title')}</h2>
<Button>{loading ? t('analyzing') : t('start_analysis')}</Button>
```

**Step 3: 更新locale配置添加新的message路径**

在 `frontend/src/config/locale/index.ts` 的 `localeMessagesPaths` 中添加:
```typescript
'pages/tiktok-analyzer',
```

**Step 4: Commit**

```bash
git add frontend/src/config/locale/
git commit -m "feat: add i18n translations for TikTok analyzer and script editor"
```

---

### Task 4.2: 添加语言切换功能

**Files:**
- Check existing language switcher component
- Modify if needed to support new pages

**Step 1: 验证现有语言切换器**

项目已有 `[locale]` 路由结构和 next-intl 配置。需要确认语言切换组件是否存在并正常工作。

**Step 2: 测试语言切换**

Run:
```bash
# 访问中文版
curl http://localhost:3000/zh

# 访问英文版
curl http://localhost:3000/en
```

Expected: 页面应根据locale显示不同语言

**Step 3: Commit (如有修改)**

```bash
git add .
git commit -m "feat: verify and update language switcher for new components"
```

---

## 测试与部署检查清单

### Task 5.1: 端到端测试

**测试流程:**

1. **分析流程测试**
   - 输入TikTok链接
   - 等待分析完成
   - 验证结果显示

2. **脚本生成测试**
   - 在分析完成后点击"AI生成脚本"
   - 验证脚本显示在编辑器中
   - 测试场景编辑功能
   - 测试保存/导出功能

3. **视频生成测试** (需要Runway API Key)
   - 编辑脚本
   - 点击"生成视频"
   - 验证视频URL返回

4. **国际化测试**
   - 切换到英文界面
   - 验证所有文案正确显示

---

## 后续优化 (Phase 2+)

以下功能不在当前MVP范围内，但已在设计文档中规划：

1. **可视化分镜编辑器** - 拖拽调整场景顺序
2. **数字人口播** - HeyGen API集成
3. **用户余额系统** - 付费功能
4. **批量处理** - 多视频分析
5. **日语/西班牙语支持** - 更多语言

---

*文档创建时间：2025-01-25*
*基于设计文档：docs/plans/2025-01-25-ecommerce-video-generator-design.md*
