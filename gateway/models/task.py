from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class TaskStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    ANALYZING = "analyzing"
    SYNCING = "syncing"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoAnalysisRequest(BaseModel):
    url: str = Field(..., description="TikTok video URL")
    callback_url: Optional[str] = Field(None, description="Optional callback URL for completion notification")
    analysis_prompt: Optional[str] = Field(
        None,
        description="Custom analysis prompt for Gemini"
    )
    sync_to_feishu: bool = Field(True, description="Whether to sync results to Feishu Bitable")

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.tiktok.com/@user/video/1234567890",
                "callback_url": "https://your-webhook.com/callback",
                "analysis_prompt": "分析这个视频的内容、风格和营销价值",
                "sync_to_feishu": True
            }
        }


class VideoAnalysisResponse(BaseModel):
    task_id: str = Field(..., description="Unique task identifier")
    status: TaskStatus = Field(..., description="Current task status")
    message: str = Field(..., description="Status message")
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "task_abc123",
                "status": "pending",
                "message": "Task created successfully",
                "created_at": "2024-01-15T10:30:00"
            }
        }


class AnalysisResult(BaseModel):
    video_title: Optional[str] = None
    author: Optional[str] = None
    duration: Optional[float] = None
    description: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    ai_analysis: Optional[str] = None
    content_summary: Optional[str] = None
    key_topics: List[str] = Field(default_factory=list)
    sentiment: Optional[str] = None
    engagement_prediction: Optional[str] = None
    recommendations: List[str] = Field(default_factory=list)
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)


class TaskStatusResponse(BaseModel):
    task_id: str
    status: TaskStatus
    progress: int = Field(0, ge=0, le=100, description="Progress percentage")
    message: str
    created_at: datetime
    updated_at: datetime
    result: Optional[AnalysisResult] = None
    error: Optional[str] = None
    video_path: Optional[str] = None
    feishu_record_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "task_abc123",
                "status": "completed",
                "progress": 100,
                "message": "Analysis completed successfully",
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:35:00",
                "result": {
                    "video_title": "Amazing TikTok Video",
                    "ai_analysis": "This video shows..."
                },
                "feishu_record_id": "rec_xyz789"
            }
        }
