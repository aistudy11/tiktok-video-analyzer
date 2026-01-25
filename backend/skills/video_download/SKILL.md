# TikTok Video Download Skill

## Purpose
Download TikTok/Douyin videos without watermark using Playwright browser automation.

## Features
- Watermark-free video download
- Metadata extraction (title, author, duration, hashtags)
- Multiple fallback download methods
- Automatic retry on failure

## Usage
```python
from video_download.download import TikTokDownloader

downloader = TikTokDownloader(storage_path="/path/to/storage")
result = downloader.download("https://www.tiktok.com/@user/video/123456")

# Result format:
{
    "success": True,
    "video_path": "/path/to/video.mp4",
    "metadata": {
        "title": "Video Title",
        "author": "username",
        "duration": 30.5,
        "description": "Video description",
        "hashtags": ["tag1", "tag2"]
    }
}
```

## Dependencies
- playwright
- httpx

## Notes
- Uses headless Chromium browser
- Respects rate limits
- Handles authentication if needed
