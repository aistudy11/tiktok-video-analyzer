"""
Notion Database Sync for TikTok Video Analysis Results

Syncs video analysis results to Notion database, similar to Feishu Bitable sync.
Uses Notion Internal Integration with API key authentication.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

import httpx

logger = logging.getLogger(__name__)


class NotionSync:
    """Sync data to Notion Database"""

    BASE_URL = "https://api.notion.com/v1"
    NOTION_VERSION = "2022-06-28"

    def __init__(self, api_key: str, database_id: str):
        """
        Initialize Notion sync

        Args:
            api_key: Notion Internal Integration API key
            database_id: Notion database ID (from database URL)
        """
        self.api_key = api_key
        self.database_id = database_id

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authorization"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Notion-Version": self.NOTION_VERSION
        }

    def _format_properties(
        self,
        task_id: str,
        url: str,
        analysis_result: Dict[str, Any],
        video_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Format analysis result to Notion database properties

        Uses Chinese field names to match Feishu Bitable for consistency.
        Notion property types: title, rich_text, number, url, select, multi_select, date
        """

        # Helper function for rich_text property
        def rich_text(content: str, max_len: int = 2000) -> Dict:
            text = (content or "")[:max_len]
            return {
                "rich_text": [{"text": {"content": text}}] if text else []
            }

        # Helper function for title property (required, only one per database)
        def title(content: str, max_len: int = 100) -> Dict:
            text = (content or "未知标题")[:max_len]
            return {
                "title": [{"text": {"content": text}}]
            }

        # Helper function for number property
        def number(value: Any) -> Dict:
            return {"number": float(value) if value else 0}

        # Helper function for url property
        def url_prop(link: str) -> Dict:
            return {"url": link if link else None}

        # Helper function for select property
        def select(value: str) -> Dict:
            return {"select": {"name": value} if value else None}

        # Helper function for date property
        def date_prop(iso_date: str) -> Dict:
            return {"date": {"start": iso_date} if iso_date else None}

        # Get parsed data for advanced fields
        parsed = analysis_result.get("parsed_data", {})

        # Build properties dict
        # Note: "视频标题" is the Title property (required, unique)
        properties = {
            # Title property (required)
            "视频标题": title(analysis_result.get("video_title", "")),

            # Basic video info
            "任务ID": rich_text(task_id),
            "视频链接": url_prop(url),
            "作者": rich_text(analysis_result.get("author", "")[:50] or "未知作者"),
            "时长(秒)": number(analysis_result.get("duration", 0)),
            "视频描述": rich_text(analysis_result.get("description", ""), 2000),
            "话题标签": rich_text(", ".join(analysis_result.get("hashtags", []))[:500]),

            # AI Analysis fields
            "内容摘要": rich_text(analysis_result.get("content_summary", ""), 2000),
            "关键话题": rich_text(", ".join(analysis_result.get("key_topics", []))[:500]),
            "情感倾向": select(analysis_result.get("sentiment", "neutral")),
            "互动潜力": select(analysis_result.get("engagement_prediction", "medium")),
            "改进建议": rich_text(
                "\n".join([f"• {r}" for r in analysis_result.get("recommendations", [])]),
                2000
            ),

            # Timestamp
            "创建时间": date_prop(datetime.now().isoformat()),
        }

        # Advanced analysis fields from parsed_data
        viral_reason = parsed.get("viral_reason") or analysis_result.get("viral_reason")
        if viral_reason:
            properties["爆款原因分析"] = rich_text(viral_reason, 2000)

        cinematography = parsed.get("cinematography") or analysis_result.get("cinematography")
        if cinematography:
            properties["镜头语言分析"] = rich_text(cinematography, 2000)

        ai_video_prompt = parsed.get("ai_video_prompt") or analysis_result.get("ai_video_prompt")
        if ai_video_prompt:
            properties["AI视频提示词"] = rich_text(ai_video_prompt, 2000)

        if parsed.get("category"):
            properties["内容分类"] = rich_text(parsed["category"])

        if parsed.get("target_audience"):
            properties["目标受众"] = rich_text(parsed["target_audience"])

        # Marketing value analysis
        if parsed.get("marketing_value"):
            mv = parsed["marketing_value"]
            marketing_text = []
            if mv.get("suitable_for_brands"):
                marketing_text.append("适合品牌合作: 是")
            else:
                marketing_text.append("适合品牌合作: 否")
            if mv.get("brand_types"):
                marketing_text.append(f"适合品牌类型: {', '.join(mv['brand_types'])}")
            if mv.get("integration_suggestions"):
                marketing_text.append(f"植入建议: {', '.join(mv['integration_suggestions'])}")
            properties["营销价值"] = rich_text("\n".join(marketing_text))

        return properties

    def create_page(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new page (record) in Notion database"""
        url = f"{self.BASE_URL}/pages"

        payload = {
            "parent": {"database_id": self.database_id},
            "properties": properties
        }

        with httpx.Client(timeout=30) as client:
            response = client.post(
                url,
                headers=self._get_headers(),
                json=payload
            )

            if response.status_code != 200:
                error_data = response.json()
                raise Exception(f"Failed to create page: {error_data.get('message', response.text)}")

            data = response.json()

        page_id = data["id"]
        logger.info(f"Created Notion page: {page_id}")

        return {
            "success": True,
            "page_id": page_id
        }

    def update_page(self, page_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing page"""
        url = f"{self.BASE_URL}/pages/{page_id}"

        payload = {"properties": properties}

        with httpx.Client(timeout=30) as client:
            response = client.patch(
                url,
                headers=self._get_headers(),
                json=payload
            )

            if response.status_code != 200:
                error_data = response.json()
                raise Exception(f"Failed to update page: {error_data.get('message', response.text)}")

        logger.info(f"Updated Notion page: {page_id}")

        return {
            "success": True,
            "page_id": page_id
        }

    def find_page_by_task_id(self, task_id: str) -> Optional[str]:
        """Find existing page by 任务ID"""
        url = f"{self.BASE_URL}/databases/{self.database_id}/query"

        payload = {
            "filter": {
                "property": "任务ID",
                "rich_text": {
                    "equals": task_id
                }
            },
            "page_size": 1
        }

        try:
            with httpx.Client(timeout=30) as client:
                response = client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )

                if response.status_code != 200:
                    logger.warning(f"Query failed: {response.text}")
                    return None

                data = response.json()

            results = data.get("results", [])
            if results:
                return results[0]["id"]

        except Exception as e:
            logger.warning(f"Error searching for page: {e}")

        return None

    def sync_analysis(
        self,
        task_id: str,
        url: str,
        analysis_result: Dict[str, Any],
        video_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sync analysis result to Notion database

        Args:
            task_id: Unique task identifier
            url: Original video URL
            analysis_result: Analysis result dict
            video_path: Path to downloaded video (optional)

        Returns:
            Dict with success status and page_id
        """
        try:
            # Format properties
            properties = self._format_properties(task_id, url, analysis_result, video_path)

            # Check if page already exists
            existing_page_id = self.find_page_by_task_id(task_id)

            if existing_page_id:
                # Update existing page
                return self.update_page(existing_page_id, properties)
            else:
                # Create new page
                return self.create_page(properties)

        except Exception as e:
            logger.error(f"Notion sync failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }


if __name__ == "__main__":
    # Test
    import sys
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    logger = logging.getLogger(__name__)

    api_key = os.environ.get("NOTION_API_KEY")
    database_id = os.environ.get("NOTION_DATABASE_ID")

    if not all([api_key, database_id]):
        logger.error("Please set NOTION_API_KEY and NOTION_DATABASE_ID environment variables")
        sys.exit(1)

    syncer = NotionSync(api_key=api_key, database_id=database_id)

    # Test sync
    result = syncer.sync_analysis(
        task_id="test_notion_123",
        url="https://www.tiktok.com/@test/video/123",
        analysis_result={
            "video_title": "测试视频 - Notion同步",
            "author": "测试用户",
            "duration": 30,
            "description": "测试描述",
            "hashtags": ["测试", "视频"],
            "content_summary": "测试摘要",
            "key_topics": ["测试话题"],
            "sentiment": "positive",
            "engagement_prediction": "high",
            "recommendations": ["建议1", "建议2"],
            "viral_reason": "测试爆款原因分析",
            "cinematography": "测试镜头语言分析",
            "ai_video_prompt": "测试AI视频提示词",
            "parsed_data": {
                "category": "测试分类",
                "target_audience": "测试用户群体",
                "marketing_value": {
                    "suitable_for_brands": True,
                    "brand_types": ["品牌类型1"],
                    "integration_suggestions": ["植入建议1"]
                }
            }
        }
    )
    logger.info(json.dumps(result, indent=2, ensure_ascii=False))
