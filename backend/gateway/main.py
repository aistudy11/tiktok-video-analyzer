from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from contextlib import asynccontextmanager
from typing import Optional, List
from pathlib import Path
from pydantic import BaseModel
import logging
import os
import sys

from config import settings
from models import (
    VideoAnalysisRequest,
    VideoAnalysisResponse,
    TaskStatusResponse,
    TaskStatus,
)
from services.task_manager import TaskManager, get_task_manager
from tasks.video_analysis import analyze_video_task

# Add skills path to sys.path for imports
skills_path = Path(__file__).parent.parent / "skills"
if str(skills_path) not in sys.path:
    sys.path.insert(0, str(skills_path))

from script_generator import (
    ScriptGenerator,
    ScriptGenerateRequest,
    ScriptGenerateResponse,
    ScriptType,
)
from services.script_manager import ScriptManager, get_script_manager


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
    4. Sync results to Notion (optional)
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
        sync_to_feishu=request.sync_to_feishu,
        sync_to_notion=request.sync_to_notion
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


@app.get("/api/v1/video/{video_filename}")
async def get_video(video_filename: str):
    """
    Stream a video file.

    This endpoint allows the frontend to access downloaded videos.
    """
    # Sanitize filename to prevent directory traversal
    if ".." in video_filename or "/" in video_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    video_path = Path(settings.video_storage_path) / video_filename

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")

    # Return video file with proper content type
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=video_filename
    )


@app.get("/api/v1/thumbnail/{task_id}")
async def get_thumbnail(
    task_id: str,
    tm: TaskManager = Depends(get_task_manager)
):
    """
    Get thumbnail URL for a task.

    Returns the thumbnail URL from the task's metadata.
    """
    task = await tm.get_task(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    result = task.result or {}
    raw_metadata = result.get("raw_metadata", {})
    thumbnail_url = raw_metadata.get("thumbnail_url", "")

    if not thumbnail_url:
        raise HTTPException(status_code=404, detail="Thumbnail not available")

    return {"thumbnail_url": thumbnail_url}


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


# === Script Generation API ===

@app.post("/api/v1/generate-script", response_model=ScriptGenerateResponse)
async def generate_script(
    request: ScriptGenerateRequest,
    tm: TaskManager = Depends(get_task_manager),
    sm: ScriptManager = Depends(get_script_manager)
):
    """
    Generate a production script from video analysis results.

    The script includes:
    - Success formula analysis (why the video went viral)
    - Shot-by-shot storyboard
    - Music beat points
    - Reusable elements for adaptation
    - Production guide
    """
    logger.info(f"Generating script for analysis: {request.video_analysis_id}")

    # Get the original analysis task
    task = await tm.get_task(request.video_analysis_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Video analysis task {request.video_analysis_id} not found"
        )

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Video analysis is not completed (status: {task.status})"
        )

    if not task.result:
        raise HTTPException(
            status_code=400,
            detail="Video analysis has no results"
        )

    # Check if script already exists
    existing_script = await sm.get_script(request.video_analysis_id)
    if existing_script and existing_script.get("script_data"):
        logger.info(f"Returning existing script for {request.video_analysis_id}")
        return ScriptGenerateResponse(
            task_id=existing_script["script_id"],
            video_analysis_id=request.video_analysis_id,
            status="completed",
            script=existing_script["script_data"]
        )

    # Prepare video info from task result
    result = task.result
    raw_metadata = result.raw_metadata or {}

    video_info = {
        "url": raw_metadata.get("video_url", ""),
        "duration": result.duration or raw_metadata.get("duration", 0),
        "author": result.author or raw_metadata.get("author", ""),
        "title": result.video_title or raw_metadata.get("title", "")
    }

    # Prepare analysis result
    analysis_result = {
        "summary": result.content_summary or result.ai_analysis,
        "viral_reason": raw_metadata.get("viral_reason", ""),
        "cinematography": raw_metadata.get("cinematography", ""),
        "ai_video_prompt": raw_metadata.get("ai_video_prompt", ""),
        "category": raw_metadata.get("category", ""),
        "target_audience": raw_metadata.get("target_audience", ""),
        "topics": result.key_topics or [],
        "sentiment": result.sentiment,
        "sentiment_reason": raw_metadata.get("sentiment_reason", ""),
        "engagement_level": result.engagement_prediction,
        "engagement_reason": raw_metadata.get("engagement_reason", ""),
        "marketing_value": raw_metadata.get("marketing_value", {}),
        "recommendations": result.recommendations or []
    }

    # Generate script
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not configured"
        )

    generator = ScriptGenerator(
        api_key=settings.gemini_api_key,
        model_name=settings.gemini_model,
        base_url=settings.gemini_base_url
    )

    script_type = ScriptType.FULL if request.script_type == "full" else ScriptType.SIMPLE
    gen_result = generator.generate_with_retry(video_info, analysis_result, script_type)

    if not gen_result["success"]:
        logger.error(f"Script generation failed: {gen_result.get('error')}")
        raise HTTPException(
            status_code=500,
            detail=f"Script generation failed: {gen_result.get('error')}"
        )

    # Save script
    script_data = gen_result["script"].model_dump()
    script_id = await sm.save_script(
        video_analysis_id=request.video_analysis_id,
        script_data=script_data,
        script_type=request.script_type
    )

    logger.info(f"Script {script_id} generated and saved for {request.video_analysis_id}")

    return ScriptGenerateResponse(
        task_id=script_id,
        video_analysis_id=request.video_analysis_id,
        status="completed",
        script=script_data
    )


@app.get("/api/v1/script/{video_analysis_id}")
async def get_script(
    video_analysis_id: str,
    sm: ScriptManager = Depends(get_script_manager)
):
    """
    Get the production script for a video analysis.

    Returns the generated script if it exists.
    """
    script_record = await sm.get_script(video_analysis_id)

    if not script_record:
        raise HTTPException(
            status_code=404,
            detail=f"Script not found for video analysis {video_analysis_id}"
        )

    return {
        "script_id": script_record["script_id"],
        "video_analysis_id": script_record["video_analysis_id"],
        "script_type": script_record.get("script_type", "full"),
        "script_data": script_record["script_data"],
        "created_at": script_record["created_at"],
        "updated_at": script_record["updated_at"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
