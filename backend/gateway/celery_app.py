from celery import Celery
from config import settings

celery_app = Celery(
    "tiktok_analyzer",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["tasks.video_analysis"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max
    task_soft_time_limit=540,  # 9 minutes soft limit
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=86400,  # 24 hours
)

celery_app.conf.beat_schedule = {
    "cleanup-old-files": {
        "task": "tasks.video_analysis.cleanup_old_files",
        "schedule": 3600.0,  # Every hour
    },
}
