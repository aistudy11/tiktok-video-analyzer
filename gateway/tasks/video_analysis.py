import os
import sys
import json
import httpx
import logging
from datetime import datetime, timedelta
from pathlib import Path

# Add parent and skills directories to path
sys.path.insert(0, str(Path(__file__).parent.parent))
# Skills are at /app/skills in Docker (same level as gateway code)
sys.path.insert(0, str(Path(__file__).parent.parent / "skills"))

from celery_app import celery_app
from config import settings
from models.task import TaskStatus
from services.task_manager import SyncTaskManager

# Import skills
from video_download.download import TikTokDownloader
from ai_analysis.analyze import GeminiVideoAnalyzer
from data_sync.bitable_sync import FeishuBitableSync

logger = logging.getLogger(__name__)


def get_task_manager() -> SyncTaskManager:
    return SyncTaskManager(settings.redis_url)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def analyze_video_task(self, task_id: str):
    """Main task orchestration for video analysis pipeline"""
    tm = get_task_manager()
    task_data = tm.get_task(task_id)

    if not task_data:
        logger.error(f"Task {task_id} not found")
        return {"error": "Task not found"}

    url = task_data["url"]
    analysis_prompt = task_data.get("analysis_prompt")
    sync_to_feishu = task_data.get("sync_to_feishu", True)
    callback_url = task_data.get("callback_url")

    video_path = None
    analysis_result = None

    try:
        # Stage 1: Download video
        tm.update_task(
            task_id,
            status=TaskStatus.DOWNLOADING,
            progress=10,
            message="Downloading video from TikTok..."
        )

        downloader = TikTokDownloader(storage_path=settings.video_storage_path)
        download_result = downloader.download(url)

        if not download_result.get("success"):
            raise Exception(f"Download failed: {download_result.get('error', 'Unknown error')}")

        video_path = download_result["video_path"]
        metadata = download_result.get("metadata", {})

        tm.update_task(
            task_id,
            progress=30,
            message="Video downloaded successfully",
            video_path=video_path
        )

        # Stage 2: AI Analysis
        tm.update_task(
            task_id,
            status=TaskStatus.ANALYZING,
            progress=40,
            message="Analyzing video with Gemini AI..."
        )

        analyzer = GeminiVideoAnalyzer(
            api_key=settings.gemini_api_key,
            model_name=settings.gemini_model,
            base_url=settings.gemini_base_url
        )
        ai_result = analyzer.analyze(
            video_path=video_path,
            custom_prompt=analysis_prompt,
            metadata=metadata
        )

        if not ai_result.get("success"):
            raise Exception(f"Analysis failed: {ai_result.get('error', 'Unknown error')}")

        analysis_result = {
            "video_title": metadata.get("title"),
            "author": metadata.get("author"),
            "duration": metadata.get("duration"),
            "description": metadata.get("description"),
            "hashtags": metadata.get("hashtags", []),
            "ai_analysis": ai_result.get("analysis"),
            "content_summary": ai_result.get("summary"),
            "key_topics": ai_result.get("topics", []),
            "sentiment": ai_result.get("sentiment"),
            "engagement_prediction": ai_result.get("engagement_prediction"),
            "recommendations": ai_result.get("recommendations", []),
            "raw_metadata": metadata
        }

        tm.update_task(
            task_id,
            progress=70,
            message="AI analysis completed",
            result=analysis_result
        )

        # Stage 3: Sync to Feishu (optional)
        feishu_record_id = None
        if sync_to_feishu:
            tm.update_task(
                task_id,
                status=TaskStatus.SYNCING,
                progress=80,
                message="Syncing results to Feishu Bitable..."
            )

            syncer = FeishuBitableSync(
                app_id=settings.feishu_app_id,
                app_secret=settings.feishu_app_secret,
                app_token=settings.feishu_bitable_app_token,
                table_id=settings.feishu_bitable_table_id
            )

            sync_result = syncer.sync_analysis(
                task_id=task_id,
                url=url,
                analysis_result=analysis_result,
                video_path=video_path
            )

            if sync_result.get("success"):
                feishu_record_id = sync_result.get("record_id")

        # Complete
        tm.update_task(
            task_id,
            status=TaskStatus.COMPLETED,
            progress=100,
            message="Analysis completed successfully",
            result=analysis_result,
            feishu_record_id=feishu_record_id
        )

        # Callback notification
        if callback_url:
            try:
                with httpx.Client(timeout=10) as client:
                    client.post(callback_url, json={
                        "task_id": task_id,
                        "status": "completed",
                        "result": analysis_result,
                        "feishu_record_id": feishu_record_id
                    })
            except Exception as e:
                logger.warning(f"Callback notification failed: {e}")

        return {
            "success": True,
            "task_id": task_id,
            "result": analysis_result,
            "feishu_record_id": feishu_record_id
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Task {task_id} failed: {error_msg}")

        tm.update_task(
            task_id,
            status=TaskStatus.FAILED,
            message=f"Task failed: {error_msg}",
            error=error_msg
        )

        # Callback notification for failure
        if callback_url:
            try:
                with httpx.Client(timeout=10) as client:
                    client.post(callback_url, json={
                        "task_id": task_id,
                        "status": "failed",
                        "error": error_msg
                    })
            except Exception as cb_e:
                logger.warning(f"Callback notification failed: {cb_e}")

        # Retry if appropriate
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)

        return {"success": False, "error": error_msg}


@celery_app.task
def cleanup_old_files():
    """Periodic task to clean up old video files"""
    logger.info("Starting cleanup of old files...")

    cutoff = datetime.now() - timedelta(days=7)
    deleted_count = 0

    video_path = Path(settings.video_storage_path)
    if video_path.exists():
        for file in video_path.iterdir():
            if file.is_file():
                mtime = datetime.fromtimestamp(file.stat().st_mtime)
                if mtime < cutoff:
                    file.unlink()
                    deleted_count += 1

    analysis_path = Path(settings.analysis_storage_path)
    if analysis_path.exists():
        for file in analysis_path.iterdir():
            if file.is_file():
                mtime = datetime.fromtimestamp(file.stat().st_mtime)
                if mtime < cutoff:
                    file.unlink()
                    deleted_count += 1

    logger.info(f"Cleanup completed, deleted {deleted_count} files")
    return {"deleted_count": deleted_count}
