# Feishu Bitable Sync Skill

## Purpose
Sync video analysis results to Feishu (Lark) Bitable for data storage and collaboration.

## Features
- Create/update records in Bitable
- Automatic token refresh
- Field mapping
- Batch operations

## Usage
```python
from data_sync.bitable_sync import FeishuBitableSync

syncer = FeishuBitableSync(
    app_id="your_app_id",
    app_secret="your_app_secret",
    app_token="your_bitable_app_token",
    table_id="your_table_id"
)

result = syncer.sync_analysis(
    task_id="task_123",
    url="https://tiktok.com/...",
    analysis_result={...},
    video_path="/path/to/video.mp4"
)

# Result format:
{
    "success": True,
    "record_id": "rec_xyz789"
}
```

## Required Bitable Fields
- task_id (文本)
- url (链接)
- video_title (文本)
- author (文本)
- duration (数字)
- description (多行文本)
- hashtags (文本)
- ai_analysis (多行文本)
- content_summary (多行文本)
- sentiment (单选)
- engagement_prediction (单选)
- recommendations (多行文本)
- created_at (日期)
- video_file (附件) - optional

## Dependencies
- httpx

## Notes
- Requires Feishu app with Bitable permissions
- Rate limited to 100 requests/minute
