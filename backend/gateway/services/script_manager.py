"""Script Manager - Manage video production scripts in Redis."""

import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
import redis.asyncio as redis

from config import settings


class ScriptManager:
    """Manage script storage and retrieval in Redis."""

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None
        self.script_prefix = "tiktok:script:"
        self.script_ttl = 86400 * 30  # 30 days

    async def get_redis(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def close(self):
        if self._redis:
            await self._redis.close()
            self._redis = None

    def _generate_script_id(self) -> str:
        return f"script_{uuid.uuid4().hex[:12]}"

    def _get_script_key(self, video_analysis_id: str) -> str:
        """Key by video_analysis_id for easy lookup."""
        return f"{self.script_prefix}{video_analysis_id}"

    async def save_script(
        self,
        video_analysis_id: str,
        script_data: Dict[str, Any],
        script_type: str = "full"
    ) -> str:
        """
        Save a generated script.

        Args:
            video_analysis_id: Associated video analysis task ID
            script_data: The production script data
            script_type: Type of script (full/simple)

        Returns:
            Script ID
        """
        script_id = self._generate_script_id()
        now = datetime.now().isoformat()

        data = {
            "script_id": script_id,
            "video_analysis_id": video_analysis_id,
            "script_type": script_type,
            "script_data": script_data,
            "created_at": now,
            "updated_at": now,
        }

        r = await self.get_redis()
        await r.setex(
            self._get_script_key(video_analysis_id),
            self.script_ttl,
            json.dumps(data, ensure_ascii=False)
        )

        return script_id

    async def get_script(self, video_analysis_id: str) -> Optional[Dict[str, Any]]:
        """
        Get script by video analysis ID.

        Args:
            video_analysis_id: The video analysis task ID

        Returns:
            Script data or None if not found
        """
        r = await self.get_redis()
        data = await r.get(self._get_script_key(video_analysis_id))

        if not data:
            return None

        return json.loads(data)

    async def delete_script(self, video_analysis_id: str) -> bool:
        """Delete a script by video analysis ID."""
        r = await self.get_redis()
        result = await r.delete(self._get_script_key(video_analysis_id))
        return result > 0

    async def update_script(
        self,
        video_analysis_id: str,
        script_data: Optional[Dict[str, Any]] = None,
        status: Optional[str] = None,
        error: Optional[str] = None
    ) -> bool:
        """Update an existing script."""
        r = await self.get_redis()
        key = self._get_script_key(video_analysis_id)
        data = await r.get(key)

        if not data:
            return False

        script_record = json.loads(data)
        script_record["updated_at"] = datetime.now().isoformat()

        if script_data is not None:
            script_record["script_data"] = script_data
        if status is not None:
            script_record["status"] = status
        if error is not None:
            script_record["error"] = error

        await r.setex(key, self.script_ttl, json.dumps(script_record, ensure_ascii=False))
        return True


# Synchronous version for background tasks
class SyncScriptManager:
    """Synchronous version of ScriptManager for use in Celery tasks."""

    def __init__(self, redis_url: str):
        import redis as sync_redis
        self.redis = sync_redis.from_url(redis_url, decode_responses=True)
        self.script_prefix = "tiktok:script:"
        self.script_ttl = 86400 * 30

    def _generate_script_id(self) -> str:
        return f"script_{uuid.uuid4().hex[:12]}"

    def _get_script_key(self, video_analysis_id: str) -> str:
        return f"{self.script_prefix}{video_analysis_id}"

    def save_script(
        self,
        video_analysis_id: str,
        script_data: Dict[str, Any],
        script_type: str = "full"
    ) -> str:
        script_id = self._generate_script_id()
        now = datetime.now().isoformat()

        data = {
            "script_id": script_id,
            "video_analysis_id": video_analysis_id,
            "script_type": script_type,
            "script_data": script_data,
            "created_at": now,
            "updated_at": now,
        }

        self.redis.setex(
            self._get_script_key(video_analysis_id),
            self.script_ttl,
            json.dumps(data, ensure_ascii=False)
        )

        return script_id

    def get_script(self, video_analysis_id: str) -> Optional[Dict[str, Any]]:
        data = self.redis.get(self._get_script_key(video_analysis_id))
        if data:
            return json.loads(data)
        return None


_script_manager: Optional[ScriptManager] = None


async def get_script_manager() -> ScriptManager:
    global _script_manager
    if _script_manager is None:
        _script_manager = ScriptManager(settings.redis_url)
    return _script_manager
