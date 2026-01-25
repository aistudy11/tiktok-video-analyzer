import os
import json
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

import httpx

logger = logging.getLogger(__name__)


class FeishuBitableSync:
    """Sync data to Feishu Bitable"""

    BASE_URL = "https://open.feishu.cn/open-apis"

    def __init__(
        self,
        app_id: str,
        app_secret: str,
        app_token: str,
        table_id: str
    ):
        """
        Initialize Feishu Bitable sync

        Args:
            app_id: Feishu app ID
            app_secret: Feishu app secret
            app_token: Bitable app token (from Bitable URL)
            table_id: Table ID within the Bitable
        """
        self.app_id = app_id
        self.app_secret = app_secret
        self.app_token = app_token
        self.table_id = table_id

        self._tenant_access_token: Optional[str] = None
        self._token_expires_at: float = 0

    def _get_tenant_access_token(self) -> str:
        """Get or refresh tenant access token"""
        if self._tenant_access_token and time.time() < self._token_expires_at:
            return self._tenant_access_token

        url = f"{self.BASE_URL}/auth/v3/tenant_access_token/internal"
        payload = {
            "app_id": self.app_id,
            "app_secret": self.app_secret
        }

        with httpx.Client(timeout=30) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        if data.get("code") != 0:
            raise Exception(f"Failed to get token: {data.get('msg')}")

        self._tenant_access_token = data["tenant_access_token"]
        # Token expires in 2 hours, refresh at 1.5 hours
        self._token_expires_at = time.time() + 5400

        logger.info("Refreshed tenant access token")
        return self._tenant_access_token

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authorization"""
        token = self._get_tenant_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def _format_fields(
        self,
        task_id: str,
        url: str,
        analysis_result: Dict[str, Any],
        video_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Format analysis result to Bitable fields (全部使用中文字段名)"""

        # 基础字段 - 视频元信息
        fields = {
            "任务ID": task_id,
            "视频链接": {
                "link": url,
                "text": url[:50] + "..." if len(url) > 50 else url
            },
            "视频标题": analysis_result.get("video_title", "")[:100] or "未知标题",
            "作者": analysis_result.get("author", "")[:50] or "未知作者",
            "时长(秒)": analysis_result.get("duration", 0),
            "视频描述": (analysis_result.get("description") or "")[:2000],
            "话题标签": ", ".join(analysis_result.get("hashtags", []))[:500],
            "创建时间": int(datetime.now().timestamp() * 1000),
        }

        # AI分析字段
        fields["内容摘要"] = (analysis_result.get("content_summary") or "")[:2000]
        fields["关键话题"] = ", ".join(analysis_result.get("key_topics", []))[:500]
        fields["情感倾向"] = analysis_result.get("sentiment", "neutral")
        fields["互动潜力"] = analysis_result.get("engagement_prediction", "medium")
        fields["改进建议"] = "\n".join(
            [f"• {r}" for r in analysis_result.get("recommendations", [])]
        )[:2000]

        # 从 parsed_data 获取详细分析数据
        parsed = analysis_result.get("parsed_data", {})

        # 爆款原因分析
        viral_reason = parsed.get("viral_reason") or analysis_result.get("viral_reason")
        if viral_reason:
            fields["爆款原因分析"] = viral_reason[:5000]

        # 镜头语言分析
        cinematography = parsed.get("cinematography") or analysis_result.get("cinematography")
        if cinematography:
            fields["镜头语言分析"] = cinematography[:5000]

        # AI视频提示词
        ai_video_prompt = parsed.get("ai_video_prompt") or analysis_result.get("ai_video_prompt")
        if ai_video_prompt:
            fields["AI视频提示词"] = ai_video_prompt[:5000]

        # 内容分类
        if parsed.get("category"):
            fields["内容分类"] = parsed["category"]

        # 目标受众
        if parsed.get("target_audience"):
            fields["目标受众"] = parsed["target_audience"]

        # 营销价值分析
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
            fields["营销价值"] = "\n".join(marketing_text)

        return fields

    def create_record(self, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record in Bitable"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{self.app_token}/tables/{self.table_id}/records"

        payload = {"fields": fields}

        with httpx.Client(timeout=30) as client:
            response = client.post(
                url,
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            data = response.json()

        if data.get("code") != 0:
            raise Exception(f"Failed to create record: {data.get('msg')}")

        record_id = data["data"]["record"]["record_id"]
        logger.info(f"Created Bitable record: {record_id}")

        return {
            "success": True,
            "record_id": record_id
        }

    def update_record(
        self,
        record_id: str,
        fields: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing record"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{self.app_token}/tables/{self.table_id}/records/{record_id}"

        payload = {"fields": fields}

        with httpx.Client(timeout=30) as client:
            response = client.put(
                url,
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            data = response.json()

        if data.get("code") != 0:
            raise Exception(f"Failed to update record: {data.get('msg')}")

        logger.info(f"Updated Bitable record: {record_id}")

        return {
            "success": True,
            "record_id": record_id
        }

    def find_record_by_task_id(self, task_id: str) -> Optional[str]:
        """Find existing record by 任务ID"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{self.app_token}/tables/{self.table_id}/records/search"

        payload = {
            "filter": {
                "conjunction": "and",
                "conditions": [
                    {
                        "field_name": "任务ID",
                        "operator": "is",
                        "value": [task_id]
                    }
                ]
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
                response.raise_for_status()
                data = response.json()

            if data.get("code") == 0 and data.get("data", {}).get("items"):
                return data["data"]["items"][0]["record_id"]

        except Exception as e:
            logger.warning(f"Error searching for record: {e}")

        return None

    def sync_analysis(
        self,
        task_id: str,
        url: str,
        analysis_result: Dict[str, Any],
        video_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sync analysis result to Bitable

        Args:
            task_id: Unique task identifier
            url: Original video URL
            analysis_result: Analysis result dict
            video_path: Path to downloaded video (optional)

        Returns:
            Dict with success status and record_id
        """
        try:
            # Format fields
            fields = self._format_fields(task_id, url, analysis_result, video_path)

            # Check if record already exists
            existing_record_id = self.find_record_by_task_id(task_id)

            if existing_record_id:
                # Update existing record
                return self.update_record(existing_record_id, fields)
            else:
                # Create new record
                return self.create_record(fields)

        except Exception as e:
            logger.error(f"Sync failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def batch_sync(
        self,
        records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Batch sync multiple records"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{self.app_token}/tables/{self.table_id}/records/batch_create"

        payload = {
            "records": [{"fields": r} for r in records]
        }

        try:
            with httpx.Client(timeout=60) as client:
                response = client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            if data.get("code") != 0:
                raise Exception(f"Batch sync failed: {data.get('msg')}")

            record_ids = [
                r["record_id"]
                for r in data.get("data", {}).get("records", [])
            ]

            return {
                "success": True,
                "record_ids": record_ids,
                "count": len(record_ids)
            }

        except Exception as e:
            logger.error(f"Batch sync failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }


if __name__ == "__main__":
    # Test
    import sys
    logging.basicConfig(level=logging.INFO)

    app_id = os.environ.get("FEISHU_APP_ID")
    app_secret = os.environ.get("FEISHU_APP_SECRET")
    app_token = os.environ.get("FEISHU_BITABLE_APP_TOKEN")
    table_id = os.environ.get("FEISHU_BITABLE_TABLE_ID")

    if not all([app_id, app_secret, app_token, table_id]):
        print("Please set all FEISHU_* environment variables")
        sys.exit(1)

    syncer = FeishuBitableSync(
        app_id=app_id,
        app_secret=app_secret,
        app_token=app_token,
        table_id=table_id
    )

    # Test sync
    result = syncer.sync_analysis(
        task_id="test_123",
        url="https://www.tiktok.com/@test/video/123",
        analysis_result={
            "video_title": "测试视频",
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
    print(json.dumps(result, indent=2, ensure_ascii=False))
