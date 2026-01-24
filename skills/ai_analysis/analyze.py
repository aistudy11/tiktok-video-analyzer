import os
import json
import time
import base64
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

import httpx

logger = logging.getLogger(__name__)


class GeminiVideoAnalyzer:
    """Analyze videos using Gemini API via APImart proxy"""

    DEFAULT_PROMPT = """你是一个专业的短视频内容分析师。请分析这个TikTok/抖音视频并提供以下信息：

## 分析要求

1. **内容摘要** (100字以内)
   - 视频主要讲什么

2. **内容分类**
   - 主题类型（如：教程、娱乐、生活、美食、科技、时尚等）
   - 目标受众

3. **关键话题** (3-5个)
   - 视频涉及的主要话题标签

4. **情感基调**
   - positive/neutral/negative
   - 简述原因

5. **互动潜力评估**
   - 预测互动等级：high/medium/low
   - 分析原因

6. **营销价值分析**
   - 是否适合品牌合作
   - 适合的品牌类型
   - 植入方式建议

7. **改进建议** (2-3条)
   - 如何提升视频质量或传播效果

请用JSON格式输出，确保可以被解析：
```json
{
    "summary": "内容摘要",
    "category": "内容分类",
    "target_audience": "目标受众",
    "topics": ["话题1", "话题2"],
    "sentiment": "positive/neutral/negative",
    "sentiment_reason": "情感基调原因",
    "engagement_level": "high/medium/low",
    "engagement_reason": "互动潜力原因",
    "marketing_value": {
        "suitable_for_brands": true/false,
        "brand_types": ["品牌类型1", "品牌类型2"],
        "integration_suggestions": ["植入建议1"]
    },
    "recommendations": ["建议1", "建议2"]
}
```
"""

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-2.0-flash-exp",
        base_url: str = "https://api.apimart.ai"
    ):
        """
        Initialize Gemini analyzer with APImart proxy

        Args:
            api_key: APImart API key
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
            "maxOutputTokens": 4096,
        }

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authorization"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _encode_video(self, video_path: str) -> str:
        """Encode video file to base64"""
        logger.info(f"Encoding video: {video_path}")
        with open(video_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _build_prompt(
        self,
        custom_prompt: Optional[str],
        metadata: Optional[Dict[str, Any]]
    ) -> str:
        """Build analysis prompt"""
        prompt_parts = []

        # Add metadata context if available
        if metadata:
            context = "## 视频元数据\n"
            if metadata.get("title"):
                context += f"- 标题: {metadata['title']}\n"
            if metadata.get("author"):
                context += f"- 作者: {metadata['author']}\n"
            if metadata.get("description"):
                context += f"- 描述: {metadata['description']}\n"
            if metadata.get("hashtags"):
                context += f"- 标签: {', '.join(metadata['hashtags'])}\n"
            if metadata.get("duration"):
                context += f"- 时长: {metadata['duration']}秒\n"
            prompt_parts.append(context)

        # Add custom prompt or default
        if custom_prompt:
            prompt_parts.append(f"## 分析要求\n{custom_prompt}")
            prompt_parts.append("\n请用JSON格式输出分析结果。")
        else:
            prompt_parts.append(self.DEFAULT_PROMPT)

        return "\n\n".join(prompt_parts)

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response and extract JSON"""
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
                    json_data = json.loads(json_str)
                    return json_data
                except json.JSONDecodeError:
                    continue

        # If no JSON found, return structured text response
        return {
            "summary": response_text[:500],
            "raw_response": response_text
        }

    def analyze(
        self,
        video_path: str,
        custom_prompt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze video with Gemini via APImart

        Args:
            video_path: Path to video file
            custom_prompt: Custom analysis prompt (optional)
            metadata: Video metadata (optional)

        Returns:
            Dict with analysis results
        """
        try:
            # Validate video file
            video_path = Path(video_path)
            if not video_path.exists():
                return {"success": False, "error": f"Video file not found: {video_path}"}

            file_size = video_path.stat().st_size
            if file_size > 20 * 1024 * 1024:  # 20MB limit for inline data
                return {"success": False, "error": "Video file too large (max 20MB for inline)"}

            # Encode video to base64
            video_base64 = self._encode_video(str(video_path))

            # Build prompt
            prompt = self._build_prompt(custom_prompt, metadata)

            # Build request payload
            url = f"{self.base_url}/v1beta/models/{self.model_name}:generateContent"

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "inlineData": {
                                    "mimeType": "video/mp4",
                                    "data": video_base64
                                }
                            },
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": self.generation_config
            }

            # Make request
            logger.info(f"Sending request to {url}")
            with httpx.Client(timeout=300) as client:
                response = client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            # Extract response text
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    response_text = ""
                    for part in candidate["content"]["parts"]:
                        if "text" in part:
                            response_text += part["text"]

                    if response_text:
                        parsed = self._parse_response(response_text)
                        return {
                            "success": True,
                            "analysis": response_text,
                            "summary": parsed.get("summary", ""),
                            "topics": parsed.get("topics", []),
                            "sentiment": parsed.get("sentiment", "neutral"),
                            "engagement_prediction": parsed.get("engagement_level", "medium"),
                            "recommendations": parsed.get("recommendations", []),
                            "parsed_data": parsed,
                        }

            return {
                "success": False,
                "error": "Empty or invalid response from Gemini API"
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"API request failed: {e.response.status_code}"
            }
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def analyze_text(
        self,
        text: str,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze text content (for metadata-only analysis)

        Args:
            text: Text to analyze
            system_prompt: Optional system prompt

        Returns:
            Dict with analysis results
        """
        try:
            url = f"{self.base_url}/v1beta/models/{self.model_name}:generateContent"

            prompt = system_prompt or "请分析以下内容并提供见解："

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{prompt}\n\n{text}"}
                        ]
                    }
                ],
                "generationConfig": self.generation_config
            }

            with httpx.Client(timeout=120) as client:
                response = client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    response_text = ""
                    for part in candidate["content"]["parts"]:
                        if "text" in part:
                            response_text += part["text"]

                    return {
                        "success": True,
                        "response": response_text
                    }

            return {"success": False, "error": "Empty response"}

        except Exception as e:
            logger.error(f"Text analysis failed: {e}")
            return {"success": False, "error": str(e)}

    def analyze_with_retry(
        self,
        video_path: str,
        custom_prompt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """Analyze with retry logic"""
        last_error = None

        for attempt in range(max_retries):
            result = self.analyze(video_path, custom_prompt, metadata)
            if result["success"]:
                return result

            last_error = result.get("error")
            logger.warning(f"Attempt {attempt + 1} failed: {last_error}")

            if attempt < max_retries - 1:
                time.sleep(5 * (attempt + 1))  # Exponential backoff

        return {
            "success": False,
            "error": f"Failed after {max_retries} attempts. Last error: {last_error}"
        }


if __name__ == "__main__":
    # Test
    import sys
    logging.basicConfig(level=logging.INFO)

    api_key = os.environ.get("GEMINI_API_KEY")
    base_url = os.environ.get("GEMINI_BASE_URL", "https://api.apimart.ai")

    if not api_key:
        print("Please set GEMINI_API_KEY environment variable")
        sys.exit(1)

    analyzer = GeminiVideoAnalyzer(
        api_key=api_key,
        base_url=base_url
    )

    if len(sys.argv) > 1:
        video_path = sys.argv[1]
        result = analyzer.analyze(video_path)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        # Test text analysis
        result = analyzer.analyze_text("这是一个测试")
        print(json.dumps(result, indent=2, ensure_ascii=False))
