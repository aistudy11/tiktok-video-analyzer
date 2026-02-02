import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
import redis.asyncio as redis
from functools import lru_cache

from config import settings
from models.task import TaskStatus, TaskStatusResponse, AnalysisResult


class TaskManager:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None
        self.task_prefix = "tiktok:task:"
        self.task_ttl = 86400 * 7  # 7 days

    async def get_redis(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def close(self):
        if self._redis:
            await self._redis.close()
            self._redis = None

    def _generate_task_id(self) -> str:
        return f"task_{uuid.uuid4().hex[:12]}"

    def _get_task_key(self, task_id: str) -> str:
        return f"{self.task_prefix}{task_id}"

    async def create_task(
        self,
        url: str,
        callback_url: Optional[str] = None,
        analysis_prompt: Optional[str] = None,
        sync_to_feishu: bool = True,
        sync_to_notion: bool = True
    ) -> str:
        task_id = self._generate_task_id()
        now = datetime.now().isoformat()

        task_data = {
            "task_id": task_id,
            "url": url,
            "callback_url": callback_url,
            "analysis_prompt": analysis_prompt,
            "sync_to_feishu": sync_to_feishu,
            "sync_to_notion": sync_to_notion,
            "status": TaskStatus.PENDING.value,
            "progress": 0,
            "message": "Task created, waiting to start",
            "created_at": now,
            "updated_at": now,
            "result": None,
            "error": None,
            "video_path": None,
            "feishu_record_id": None,
            "notion_page_id": None,
        }

        r = await self.get_redis()
        await r.setex(
            self._get_task_key(task_id),
            self.task_ttl,
            json.dumps(task_data)
        )

        return task_id

    async def get_task(self, task_id: str) -> Optional[TaskStatusResponse]:
        r = await self.get_redis()
        data = await r.get(self._get_task_key(task_id))

        if not data:
            return None

        task_data = json.loads(data)

        result = None
        if task_data.get("result"):
            result = AnalysisResult(**task_data["result"])

        return TaskStatusResponse(
            task_id=task_data["task_id"],
            status=TaskStatus(task_data["status"]),
            progress=task_data["progress"],
            message=task_data["message"],
            created_at=datetime.fromisoformat(task_data["created_at"]),
            updated_at=datetime.fromisoformat(task_data["updated_at"]),
            result=result,
            error=task_data.get("error"),
            video_path=task_data.get("video_path"),
            feishu_record_id=task_data.get("feishu_record_id"),
            notion_page_id=task_data.get("notion_page_id"),
        )

    async def update_task(
        self,
        task_id: str,
        status: Optional[TaskStatus] = None,
        progress: Optional[int] = None,
        message: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        video_path: Optional[str] = None,
        feishu_record_id: Optional[str] = None,
        notion_page_id: Optional[str] = None,
    ) -> bool:
        r = await self.get_redis()
        key = self._get_task_key(task_id)
        data = await r.get(key)

        if not data:
            return False

        task_data = json.loads(data)
        task_data["updated_at"] = datetime.now().isoformat()

        if status is not None:
            task_data["status"] = status.value
        if progress is not None:
            task_data["progress"] = progress
        if message is not None:
            task_data["message"] = message
        if result is not None:
            task_data["result"] = result
        if error is not None:
            task_data["error"] = error
        if video_path is not None:
            task_data["video_path"] = video_path
        if feishu_record_id is not None:
            task_data["feishu_record_id"] = feishu_record_id
        if notion_page_id is not None:
            task_data["notion_page_id"] = notion_page_id

        await r.setex(key, self.task_ttl, json.dumps(task_data))
        return True

    async def get_task_raw(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get raw task data for Celery workers"""
        r = await self.get_redis()
        data = await r.get(self._get_task_key(task_id))
        if data:
            return json.loads(data)
        return None


# Synchronous version for Celery workers
class SyncTaskManager:
    def __init__(self, redis_url: str):
        import redis as sync_redis
        self.redis = sync_redis.from_url(redis_url, decode_responses=True)
        self.task_prefix = "tiktok:task:"
        self.task_ttl = 86400 * 7

    def _get_task_key(self, task_id: str) -> str:
        return f"{self.task_prefix}{task_id}"

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        data = self.redis.get(self._get_task_key(task_id))
        if data:
            return json.loads(data)
        return None

    def update_task(
        self,
        task_id: str,
        status: Optional[TaskStatus] = None,
        progress: Optional[int] = None,
        message: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        video_path: Optional[str] = None,
        feishu_record_id: Optional[str] = None,
        notion_page_id: Optional[str] = None,
    ) -> bool:
        key = self._get_task_key(task_id)
        data = self.redis.get(key)

        if not data:
            return False

        task_data = json.loads(data)
        task_data["updated_at"] = datetime.now().isoformat()

        if status is not None:
            task_data["status"] = status.value
        if progress is not None:
            task_data["progress"] = progress
        if message is not None:
            task_data["message"] = message
        if result is not None:
            task_data["result"] = result
        if error is not None:
            task_data["error"] = error
        if video_path is not None:
            task_data["video_path"] = video_path
        if feishu_record_id is not None:
            task_data["feishu_record_id"] = feishu_record_id
        if notion_page_id is not None:
            task_data["notion_page_id"] = notion_page_id

        self.redis.setex(key, self.task_ttl, json.dumps(task_data))
        return True


_task_manager: Optional[TaskManager] = None


async def get_task_manager() -> TaskManager:
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager(settings.redis_url)
    return _task_manager
