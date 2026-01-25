from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional, List
from pydantic import BaseModel
import logging

from config import settings
from models import (
    VideoAnalysisRequest,
    VideoAnalysisResponse,
    TaskStatusResponse,
    TaskStatus,
)
from services.task_manager import TaskManager, get_task_manager
from tasks.video_analysis import analyze_video_task


# Trending videos response models
class VideoAuthor(BaseModel):
    id: str
    uniqueId: str
    nickname: str
    avatarUrl: Optional[str] = None


class VideoStats(BaseModel):
    playCount: int
    likeCount: int
    commentCount: int
    shareCount: int


class TikTokVideo(BaseModel):
    id: str
    url: str
    title: str
    description: Optional[str] = None
    author: VideoAuthor
    stats: VideoStats
    coverUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    duration: Optional[int] = None
    createTime: Optional[int] = None
    hashtags: Optional[List[str]] = None


class TrendingVideosResponse(BaseModel):
    videos: List[TikTokVideo]
    cursor: Optional[str] = None
    hasMore: bool = False
    totalCount: Optional[int] = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TikTok Video Analyzer API...")
    yield
    tm = await get_task_manager()
    await tm.close()
    logger.info("Shutting down...")


app = FastAPI(
    title="TikTok Video Analyzer API",
    description="Cloud automation system for TikTok video analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "TikTok Video Analyzer",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/v1/analyze", response_model=VideoAnalysisResponse)
async def create_analysis_task(
    request: VideoAnalysisRequest,
    tm: TaskManager = Depends(get_task_manager)
):
    """
    Create a new video analysis task.

    The task will:
    1. Download the TikTok video (watermark-free)
    2. Analyze with Gemini 2.5 Pro
    3. Sync results to Feishu Bitable (optional)
    """
    logger.info(f"Creating analysis task for URL: {request.url}")

    # Validate URL
    if not any(domain in request.url for domain in ["tiktok.com", "douyin.com"]):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL. Must be a TikTok or Douyin video URL."
        )

    # Create task in Redis
    task_id = await tm.create_task(
        url=request.url,
        callback_url=request.callback_url,
        analysis_prompt=request.analysis_prompt,
        sync_to_feishu=request.sync_to_feishu
    )

    # Queue Celery task
    analyze_video_task.delay(task_id)

    logger.info(f"Task {task_id} created and queued")

    return VideoAnalysisResponse(
        task_id=task_id,
        status=TaskStatus.PENDING,
        message="Task created and queued for processing"
    )


@app.get("/api/v1/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    tm: TaskManager = Depends(get_task_manager)
):
    """
    Get the status of an analysis task.

    Returns current status, progress, and results if completed.
    """
    task = await tm.get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task {task_id} not found"
        )

    return task


@app.delete("/api/v1/task/{task_id}")
async def cancel_task(
    task_id: str,
    tm: TaskManager = Depends(get_task_manager)
):
    """Cancel a pending task (if not yet started)"""
    task = await tm.get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task {task_id} not found"
        )

    if task.status not in [TaskStatus.PENDING]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel task in {task.status} state"
        )

    await tm.update_task(
        task_id,
        status=TaskStatus.FAILED,
        message="Task cancelled by user",
        error="Cancelled"
    )

    return {"message": f"Task {task_id} cancelled"}


@app.get("/api/v1/trending/videos", response_model=TrendingVideosResponse)
async def get_trending_videos(
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    limit: int = Query(20, ge=1, le=50, description="Number of videos to return")
):
    """
    Get trending TikTok videos.

    This endpoint returns a list of trending videos.
    Currently returns placeholder data - will be implemented with
    actual TikTok data fetching in a future update.
    """
    logger.info(f"Fetching trending videos: cursor={cursor}, limit={limit}")

    # Placeholder response - to be replaced with actual trending video fetching
    # The trending_fetcher skill can be used to implement this
    sample_videos = [
        TikTokVideo(
            id="sample_1",
            url="https://www.tiktok.com/@example/video/1",
            title="Sample Trending Video 1",
            description="This is a sample trending video",
            author=VideoAuthor(
                id="author_1",
                uniqueId="example_creator",
                nickname="Example Creator",
                avatarUrl=None
            ),
            stats=VideoStats(
                playCount=1000000,
                likeCount=50000,
                commentCount=1000,
                shareCount=500
            ),
            coverUrl=None,
            hashtags=["trending", "viral", "fyp"]
        ),
        TikTokVideo(
            id="sample_2",
            url="https://www.tiktok.com/@example2/video/2",
            title="Sample Trending Video 2",
            description="Another sample trending video",
            author=VideoAuthor(
                id="author_2",
                uniqueId="popular_user",
                nickname="Popular User",
                avatarUrl=None
            ),
            stats=VideoStats(
                playCount=2500000,
                likeCount=120000,
                commentCount=3000,
                shareCount=1500
            ),
            coverUrl=None,
            hashtags=["trending", "dance", "music"]
        ),
    ]

    return TrendingVideosResponse(
        videos=sample_videos[:limit],
        cursor=None,
        hasMore=False,
        totalCount=len(sample_videos)
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
