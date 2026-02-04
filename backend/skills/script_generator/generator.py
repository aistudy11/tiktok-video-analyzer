"""Script Generator - Generate production scripts from video analysis results.

Uses Gemini API to transform video analysis into actionable production scripts.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import httpx

from .schemas import (
    ProductionScript,
    ScriptType,
    VideoInfo,
    SuccessFormula,
    StoryboardShot,
    MusicBeats,
    BeatPoint,
    ReusableElements,
    OpeningHook,
    EngagementTrigger,
    CallToAction,
    ProductionGuide,
    PreparationStep,
)

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent / "prompts"


class ScriptGenerator:
    """Generate video production scripts from analysis results using Gemini API."""

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-2.0-flash-exp",
        base_url: str = "https://api.apimart.ai"
    ):
        """
        Initialize ScriptGenerator.

        Args:
            api_key: APImart API key for Gemini
            model_name: Gemini model to use
            base_url: APImart base URL
        """
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = base_url.rstrip('/')

        self.generation_config = {
            "temperature": 0.7,
            "topP": 0.95,
            "topK": 40,
            "maxOutputTokens": 8192,
        }

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authorization."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _load_prompt_template(self, script_type: ScriptType) -> str:
        """Load prompt template based on script type."""
        filename = "full_script.txt" if script_type == ScriptType.FULL else "simple_script.txt"
        prompt_path = PROMPTS_DIR / filename

        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt template not found: {prompt_path}")

        return prompt_path.read_text(encoding="utf-8")

    def _build_prompt(
        self,
        video_info: Dict[str, Any],
        analysis_result: Dict[str, Any],
        script_type: ScriptType
    ) -> str:
        """Build the generation prompt with video info and analysis."""
        template = self._load_prompt_template(script_type)

        # Replace placeholders
        prompt = template.replace("{{video_url}}", video_info.get("url", ""))
        prompt = prompt.replace("{{duration}}", str(video_info.get("duration", 0)))
        prompt = prompt.replace("{{author}}", video_info.get("author", ""))
        prompt = prompt.replace("{{title}}", video_info.get("title", ""))

        # Format existing analysis as readable text
        analysis_text = self._format_analysis(analysis_result)
        prompt = prompt.replace("{{existing_analysis}}", analysis_text)

        return prompt

    def _format_analysis(self, analysis: Dict[str, Any]) -> str:
        """Format analysis result as readable text for prompt."""
        parts = []

        if analysis.get("summary"):
            parts.append(f"**内容摘要**: {analysis['summary']}")

        if analysis.get("viral_reason"):
            parts.append(f"**爆款原因**: {analysis['viral_reason']}")

        if analysis.get("cinematography"):
            parts.append(f"**镜头语言**: {analysis['cinematography']}")

        if analysis.get("ai_video_prompt"):
            parts.append(f"**AI视频提示词**: {analysis['ai_video_prompt']}")

        if analysis.get("category"):
            parts.append(f"**内容分类**: {analysis['category']}")

        if analysis.get("target_audience"):
            parts.append(f"**目标受众**: {analysis['target_audience']}")

        if analysis.get("topics"):
            parts.append(f"**关键话题**: {', '.join(analysis['topics'])}")

        if analysis.get("sentiment"):
            parts.append(f"**情感基调**: {analysis['sentiment']}")
            if analysis.get("sentiment_reason"):
                parts.append(f"  - 原因: {analysis['sentiment_reason']}")

        if analysis.get("engagement_level"):
            parts.append(f"**互动潜力**: {analysis['engagement_level']}")
            if analysis.get("engagement_reason"):
                parts.append(f"  - 原因: {analysis['engagement_reason']}")

        if analysis.get("marketing_value"):
            mv = analysis["marketing_value"]
            parts.append(f"**营销价值**:")
            parts.append(f"  - 适合品牌合作: {'是' if mv.get('suitable_for_brands') else '否'}")
            if mv.get("brand_types"):
                parts.append(f"  - 适合品牌类型: {', '.join(mv['brand_types'])}")

        if analysis.get("recommendations"):
            parts.append(f"**改进建议**: {', '.join(analysis['recommendations'])}")

        return "\n".join(parts) if parts else "暂无分析结果"

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response and extract JSON."""
        import re

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

        raise ValueError("Failed to parse JSON from response")

    def _validate_and_build_script(
        self,
        data: Dict[str, Any],
        video_info: Dict[str, Any]
    ) -> ProductionScript:
        """Validate parsed data and build ProductionScript model."""
        # Build VideoInfo
        vi_data = data.get("video_info", {})
        video_info_model = VideoInfo(
            original_url=vi_data.get("original_url", video_info.get("url", "")),
            duration=vi_data.get("duration", video_info.get("duration", 0)),
            author=vi_data.get("author", video_info.get("author", "")),
            title=vi_data.get("title", video_info.get("title", ""))
        )

        # Build SuccessFormula
        sf_data = data.get("success_formula", {})
        success_formula = SuccessFormula(
            hook_type=sf_data.get("hook_type", "未知"),
            hook_description=sf_data.get("hook_description", ""),
            content_structure=sf_data.get("content_structure", ""),
            emotional_arc=sf_data.get("emotional_arc", ""),
            key_success_factors=sf_data.get("key_success_factors", [])
        )

        # Build Storyboard
        storyboard = []
        for shot in data.get("storyboard", []):
            storyboard.append(StoryboardShot(
                shot_number=shot.get("shot_number", 0),
                time_start=shot.get("time_start", "00:00"),
                time_end=shot.get("time_end", "00:00"),
                duration=shot.get("duration", 0),
                shot_type=shot.get("shot_type", ""),
                visual_description=shot.get("visual_description", ""),
                script_text=shot.get("script_text", ""),
                action_description=shot.get("action_description", ""),
                camera_movement=shot.get("camera_movement", ""),
                transition=shot.get("transition", ""),
                emotion=shot.get("emotion", ""),
                notes=shot.get("notes", "")
            ))

        # Build MusicBeats
        mb_data = data.get("music_beats", {})
        beat_points = [
            BeatPoint(
                time=bp.get("time", "00:00"),
                action=bp.get("action", ""),
                description=bp.get("description", "")
            )
            for bp in mb_data.get("beat_points", [])
        ]
        music_beats = MusicBeats(
            music_style=mb_data.get("music_style", ""),
            bpm_range=mb_data.get("bpm_range", ""),
            beat_points=beat_points
        )

        # Build ReusableElements
        re_data = data.get("reusable_elements", {})
        oh_data = re_data.get("opening_hook", {})
        opening_hook = OpeningHook(
            technique=oh_data.get("technique", ""),
            example=oh_data.get("example", ""),
            how_to_adapt=oh_data.get("how_to_adapt", "")
        )

        engagement_triggers = [
            EngagementTrigger(
                trigger_type=et.get("trigger_type", ""),
                original_example=et.get("original_example", ""),
                adaptation_tip=et.get("adaptation_tip", "")
            )
            for et in re_data.get("engagement_triggers", [])
        ]

        cta_data = re_data.get("call_to_action", {})
        call_to_action = CallToAction(
            cta_type=cta_data.get("cta_type", ""),
            original_text=cta_data.get("original_text", ""),
            template=cta_data.get("template", "")
        )

        reusable_elements = ReusableElements(
            opening_hook=opening_hook,
            engagement_triggers=engagement_triggers,
            call_to_action=call_to_action
        )

        # Build ProductionGuide
        pg_data = data.get("production_guide", {})
        preparation_steps = [
            PreparationStep(
                step=ps.get("step", 0),
                description=ps.get("description", ""),
                details=ps.get("details", "")
            )
            for ps in pg_data.get("preparation_steps", [])
        ]
        production_guide = ProductionGuide(
            equipment_needed=pg_data.get("equipment_needed", []),
            preparation_steps=preparation_steps,
            shooting_tips=pg_data.get("shooting_tips", []),
            editing_tips=pg_data.get("editing_tips", []),
            estimated_production_time=pg_data.get("estimated_production_time", "")
        )

        # Build final ProductionScript
        return ProductionScript(
            script_version=data.get("script_version", "1.0"),
            video_info=video_info_model,
            success_formula=success_formula,
            storyboard=storyboard,
            music_beats=music_beats,
            reusable_elements=reusable_elements,
            production_guide=production_guide
        )

    def generate(
        self,
        video_info: Dict[str, Any],
        analysis_result: Dict[str, Any],
        script_type: ScriptType = ScriptType.FULL
    ) -> Dict[str, Any]:
        """
        Generate a production script from video analysis.

        Args:
            video_info: Video metadata (url, duration, author, title)
            analysis_result: Existing AI analysis result
            script_type: Type of script to generate (full or simple)

        Returns:
            Dict with success status and ProductionScript or error
        """
        try:
            # Build prompt
            prompt = self._build_prompt(video_info, analysis_result, script_type)

            # Build request payload
            url = f"{self.base_url}/v1beta/models/{self.model_name}:generateContent"

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": self.generation_config
            }

            # Make request
            logger.info(f"Generating script for video: {video_info.get('url', 'unknown')}")
            with httpx.Client(timeout=120) as client:
                response = client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            # Extract response text
            if "candidates" not in data or len(data["candidates"]) == 0:
                return {"success": False, "error": "Empty response from Gemini API"}

            candidate = data["candidates"][0]
            if "content" not in candidate or "parts" not in candidate["content"]:
                return {"success": False, "error": "Invalid response structure"}

            response_text = ""
            for part in candidate["content"]["parts"]:
                if "text" in part:
                    response_text += part["text"]

            if not response_text:
                return {"success": False, "error": "Empty text in response"}

            # Parse JSON from response
            parsed_data = self._parse_response(response_text)

            # Build and validate ProductionScript
            script = self._validate_and_build_script(parsed_data, video_info)

            return {
                "success": True,
                "script": script,
                "raw_response": response_text
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"API request failed: {e.response.status_code}"
            }
        except ValueError as e:
            logger.error(f"Parse error: {e}")
            return {
                "success": False,
                "error": f"Failed to parse response: {e}"
            }
        except Exception as e:
            logger.error(f"Script generation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_with_retry(
        self,
        video_info: Dict[str, Any],
        analysis_result: Dict[str, Any],
        script_type: ScriptType = ScriptType.FULL,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """Generate script with retry logic."""
        import time

        last_error = None

        for attempt in range(max_retries):
            result = self.generate(video_info, analysis_result, script_type)
            if result["success"]:
                return result

            last_error = result.get("error")
            logger.warning(f"Attempt {attempt + 1} failed: {last_error}")

            if attempt < max_retries - 1:
                time.sleep(5 * (attempt + 1))

        return {
            "success": False,
            "error": f"Failed after {max_retries} attempts. Last error: {last_error}"
        }


if __name__ == "__main__":
    # Test
    import sys
    logging.basicConfig(level=logging.INFO, format='%(message)s')

    api_key = os.environ.get("GEMINI_API_KEY")
    base_url = os.environ.get("GEMINI_BASE_URL", "https://api.apimart.ai")

    if not api_key:
        logger.error("Please set GEMINI_API_KEY environment variable")
        sys.exit(1)

    generator = ScriptGenerator(api_key=api_key, base_url=base_url)

    # Test with sample data
    sample_video_info = {
        "url": "https://www.tiktok.com/@example/video/123",
        "duration": 15,
        "author": "example_creator",
        "title": "Sample Video"
    }

    sample_analysis = {
        "summary": "这是一个测试视频",
        "viral_reason": "内容有趣",
        "cinematography": "使用了特写镜头",
        "topics": ["测试", "示例"],
        "sentiment": "positive"
    }

    result = generator.generate(sample_video_info, sample_analysis, ScriptType.SIMPLE)
    print(json.dumps(
        result if not result.get("success") else {"success": True, "script": result["script"].model_dump()},
        indent=2,
        ensure_ascii=False
    ))
