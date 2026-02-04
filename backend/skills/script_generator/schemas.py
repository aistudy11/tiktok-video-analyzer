"""Pydantic models for video production scripts.

Based on the JSON schema defined in docs/视频脚本生成功能设计.md
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ScriptType(str, Enum):
    """Script generation type"""
    FULL = "full"
    SIMPLE = "simple"


# === Video Info ===

class VideoInfo(BaseModel):
    """Basic video information"""
    original_url: str = Field(..., description="Original video URL")
    duration: float = Field(..., description="Video duration in seconds")
    author: str = Field(..., description="Video author")
    title: str = Field(..., description="Video title")


# === Success Formula ===

class SuccessFormula(BaseModel):
    """Analysis of why the video went viral"""
    hook_type: str = Field(..., description="Opening hook type (悬念型/冲突型/利益型/好奇型/共鸣型)")
    hook_description: str = Field(..., description="Detailed hook description")
    content_structure: str = Field(..., description="Content structure (问题-解决/故事-反转/教程-演示等)")
    emotional_arc: str = Field(..., description="Emotional arc description")
    key_success_factors: List[str] = Field(default_factory=list, description="Key success factors")


# === Storyboard ===

class StoryboardShot(BaseModel):
    """Single shot in the storyboard"""
    shot_number: int = Field(..., description="Shot number")
    time_start: str = Field(..., description="Start time (MM:SS)")
    time_end: str = Field(..., description="End time (MM:SS)")
    duration: float = Field(..., description="Shot duration in seconds")
    shot_type: str = Field(..., description="Shot type (特写/中景/全景/运镜等)")
    visual_description: str = Field(..., description="Visual content description")
    script_text: str = Field("", description="Script text/voiceover/subtitles")
    action_description: str = Field(..., description="Character action description")
    camera_movement: str = Field(..., description="Camera movement (推/拉/摇/移/跟/固定)")
    transition: str = Field(..., description="Transition effect (硬切/淡入淡出/滑动等)")
    emotion: str = Field(..., description="Emotional tone of the shot")
    notes: str = Field("", description="Shooting notes")


# === Music Beats ===

class BeatPoint(BaseModel):
    """Single beat point for music sync"""
    time: str = Field(..., description="Time point (MM:SS)")
    action: str = Field(..., description="Beat action (切镜头/特效/文字弹出等)")
    description: str = Field(..., description="Detailed description")


class MusicBeats(BaseModel):
    """Music and beat synchronization info"""
    music_style: str = Field(..., description="Recommended music style")
    bpm_range: str = Field(..., description="Recommended BPM range")
    beat_points: List[BeatPoint] = Field(default_factory=list, description="Key beat points")


# === Reusable Elements ===

class OpeningHook(BaseModel):
    """Reusable opening hook technique"""
    technique: str = Field(..., description="Opening technique")
    example: str = Field(..., description="Original video example")
    how_to_adapt: str = Field(..., description="How to adapt for new videos")


class EngagementTrigger(BaseModel):
    """Engagement trigger element"""
    trigger_type: str = Field(..., description="Trigger type")
    original_example: str = Field(..., description="Original video example")
    adaptation_tip: str = Field(..., description="Adaptation tip")


class CallToAction(BaseModel):
    """Call to action element"""
    cta_type: str = Field(..., description="CTA type")
    original_text: str = Field(..., description="Original CTA text")
    template: str = Field(..., description="Reusable template")


class ReusableElements(BaseModel):
    """Collection of reusable elements from the video"""
    opening_hook: OpeningHook
    engagement_triggers: List[EngagementTrigger] = Field(default_factory=list)
    call_to_action: CallToAction


# === Production Guide ===

class PreparationStep(BaseModel):
    """Single preparation step"""
    step: int = Field(..., description="Step number")
    description: str = Field(..., description="Step description")
    details: str = Field(..., description="Step details")


class ProductionGuide(BaseModel):
    """Detailed production guide"""
    equipment_needed: List[str] = Field(default_factory=list, description="Required equipment")
    preparation_steps: List[PreparationStep] = Field(default_factory=list, description="Preparation steps")
    shooting_tips: List[str] = Field(default_factory=list, description="Shooting tips")
    editing_tips: List[str] = Field(default_factory=list, description="Editing tips")
    estimated_production_time: str = Field(..., description="Estimated production time")


# === Main Production Script ===

class ProductionScript(BaseModel):
    """Complete video production script"""
    script_version: str = Field(default="1.0", description="Script schema version")
    video_info: VideoInfo
    success_formula: SuccessFormula
    storyboard: List[StoryboardShot] = Field(default_factory=list, description="Shot-by-shot storyboard")
    music_beats: MusicBeats
    reusable_elements: ReusableElements
    production_guide: ProductionGuide


# === API Request/Response Models ===

class ScriptGenerateRequest(BaseModel):
    """Request model for script generation API"""
    video_analysis_id: str = Field(..., description="ID of existing video analysis")
    script_type: ScriptType = Field(default=ScriptType.FULL, description="Script type (full or simple)")
    category: Optional[str] = Field(None, description="Optional category for category-specific prompts")

    class Config:
        json_schema_extra = {
            "example": {
                "video_analysis_id": "task_abc123",
                "script_type": "full",
                "category": None
            }
        }


class ScriptGenerateResponse(BaseModel):
    """Response model for script generation API"""
    task_id: str = Field(..., description="Script generation task ID")
    video_analysis_id: str = Field(..., description="Original video analysis ID")
    status: str = Field(..., description="Status: pending/processing/completed/failed")
    script: Optional[ProductionScript] = Field(None, description="Generated script (when completed)")
    error: Optional[str] = Field(None, description="Error message (when failed)")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "script_xyz789",
                "video_analysis_id": "task_abc123",
                "status": "completed",
                "script": None,
                "error": None,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:35:00"
            }
        }


class ScriptStorageModel(BaseModel):
    """Model for storing scripts in database/cache"""
    script_id: str = Field(..., description="Unique script ID")
    video_analysis_id: str = Field(..., description="Associated video analysis ID")
    script_data: ProductionScript
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
