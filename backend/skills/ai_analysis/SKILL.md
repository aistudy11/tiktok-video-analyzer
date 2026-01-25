# AI Video Analysis Skill

## Purpose
Analyze TikTok videos using Google Gemini 2.5 Pro with video understanding capabilities.

## Features
- Video content understanding
- Multi-language support (Chinese/English)
- Custom analysis prompts
- Structured output (summary, topics, sentiment, recommendations)

## Usage
```python
from ai_analysis.analyze import GeminiVideoAnalyzer

analyzer = GeminiVideoAnalyzer(api_key="your_api_key")
result = analyzer.analyze(
    video_path="/path/to/video.mp4",
    custom_prompt="分析这个视频的营销价值",
    metadata={"title": "...", "author": "..."}
)

# Result format:
{
    "success": True,
    "analysis": "详细分析内容...",
    "summary": "简短摘要",
    "topics": ["话题1", "话题2"],
    "sentiment": "positive",
    "engagement_prediction": "high",
    "recommendations": ["建议1", "建议2"]
}
```

## Dependencies
- google-generativeai

## Supported Models
- gemini-2.0-flash-exp (default, supports video)
- gemini-1.5-pro (fallback)

## Notes
- Video file must be under 2GB
- Supports MP4, MOV, WEBM formats
- Analysis language follows video content language
