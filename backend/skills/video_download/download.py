import os
import re
import json
import uuid
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs

import httpx
from playwright.sync_api import sync_playwright, Page, Browser

logger = logging.getLogger(__name__)


class TikTokDownloader:
    """Download TikTok videos without watermark using Playwright"""

    def __init__(self, storage_path: str = "/app/storage/videos"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.timeout = 60000  # 60 seconds
        self.user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )

    def _extract_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from TikTok URL"""
        patterns = [
            r"/video/(\d+)",
            r"/v/(\d+)",
            r"vm\.tiktok\.com/(\w+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        return None

    def _get_video_metadata(self, page: Page, url: str) -> Dict[str, Any]:
        """Extract video metadata from page"""
        metadata = {
            "title": "",
            "author": "",
            "description": "",
            "duration": 0,
            "hashtags": [],
            "likes": 0,
            "comments": 0,
            "shares": 0,
        }

        try:
            # Wait for page to load
            page.wait_for_load_state("networkidle", timeout=self.timeout)
            time.sleep(2)  # Additional wait for dynamic content

            # Try to extract from JSON-LD
            json_ld_scripts = page.query_selector_all('script[type="application/ld+json"]')
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, dict):
                        metadata["title"] = data.get("name", "")
                        metadata["description"] = data.get("description", "")
                        if "author" in data:
                            metadata["author"] = data["author"].get("name", "")
                        if "duration" in data:
                            # Parse ISO 8601 duration
                            duration_str = data["duration"]
                            match = re.search(r"PT(\d+)M?(\d*)S?", duration_str)
                            if match:
                                minutes = int(match.group(1)) if match.group(1) else 0
                                seconds = int(match.group(2)) if match.group(2) else 0
                                metadata["duration"] = minutes * 60 + seconds
                except (json.JSONDecodeError, KeyError):
                    continue

            # Try to extract from meta tags
            if not metadata["title"]:
                og_title = page.query_selector('meta[property="og:title"]')
                if og_title:
                    metadata["title"] = og_title.get_attribute("content") or ""

            if not metadata["description"]:
                og_desc = page.query_selector('meta[property="og:description"]')
                if og_desc:
                    metadata["description"] = og_desc.get_attribute("content") or ""

            # Extract author from URL or page
            if not metadata["author"]:
                author_match = re.search(r"@([\w.]+)", url)
                if author_match:
                    metadata["author"] = author_match.group(1)

            # Extract hashtags from description
            hashtags = re.findall(r"#(\w+)", metadata["description"])
            metadata["hashtags"] = list(set(hashtags))

            # Try to get engagement stats
            try:
                stats_elements = page.query_selector_all('[data-e2e="like-count"], [data-e2e="comment-count"], [data-e2e="share-count"]')
                for elem in stats_elements:
                    text = elem.inner_text().strip()
                    # Convert K, M suffixes
                    multiplier = 1
                    if "K" in text:
                        multiplier = 1000
                        text = text.replace("K", "")
                    elif "M" in text:
                        multiplier = 1000000
                        text = text.replace("M", "")
                    try:
                        value = int(float(text) * multiplier)
                        e2e_attr = elem.get_attribute("data-e2e")
                        if "like" in e2e_attr:
                            metadata["likes"] = value
                        elif "comment" in e2e_attr:
                            metadata["comments"] = value
                        elif "share" in e2e_attr:
                            metadata["shares"] = value
                    except (ValueError, TypeError):
                        pass
            except Exception:
                pass

        except Exception as e:
            logger.warning(f"Error extracting metadata: {e}")

        return metadata

    def _get_video_url(self, page: Page) -> Optional[str]:
        """Extract video URL from page"""
        video_url = None

        try:
            # Method 1: Get from video element source
            video_elem = page.query_selector("video")
            if video_elem:
                video_url = video_elem.get_attribute("src")
                if video_url and "blob:" not in video_url:
                    return video_url

            # Method 2: Look in page data
            scripts = page.query_selector_all("script")
            for script in scripts:
                content = script.inner_text()
                # Look for playAddr or downloadAddr in JSON
                patterns = [
                    r'"playAddr":"([^"]+)"',
                    r'"downloadAddr":"([^"]+)"',
                    r'"playUrl":"([^"]+)"',
                    r'"videoUrl":"([^"]+)"',
                ]
                for pattern in patterns:
                    match = re.search(pattern, content)
                    if match:
                        url = match.group(1)
                        # Unescape unicode
                        url = url.encode().decode("unicode_escape")
                        if url.startswith("http"):
                            return url

            # Method 3: Intercept network requests
            # This would require setting up request interception before navigation

        except Exception as e:
            logger.warning(f"Error extracting video URL: {e}")

        return video_url

    def _download_video_file(self, video_url: str, output_path: Path) -> bool:
        """Download video file from URL"""
        headers = {
            "User-Agent": self.user_agent,
            "Referer": "https://www.tiktok.com/",
            "Accept": "*/*",
            "Accept-Encoding": "identity",
        }

        try:
            with httpx.Client(timeout=120, follow_redirects=True) as client:
                response = client.get(video_url, headers=headers)
                response.raise_for_status()

                with open(output_path, "wb") as f:
                    f.write(response.content)

                # Verify file size
                if output_path.stat().st_size > 1000:  # At least 1KB
                    return True
                else:
                    output_path.unlink()
                    return False

        except Exception as e:
            logger.error(f"Error downloading video: {e}")
            return False

    def _try_api_download(self, url: str, output_path: Path) -> Optional[Dict[str, Any]]:
        """Try downloading via third-party API services"""
        api_services = [
            {
                "name": "tikwm",
                "url": "https://www.tikwm.com/api/",
                "params": {"url": url, "hd": 1}
            },
            {
                "name": "tikmate",
                "url": "https://api.tikmate.app/api/lookup",
                "params": {"url": url}
            }
        ]

        for service in api_services:
            try:
                logger.info(f"Trying {service['name']} API...")
                with httpx.Client(timeout=30) as client:
                    if service["name"] == "tikwm":
                        response = client.post(service["url"], data=service["params"])
                    else:
                        response = client.get(service["url"], params=service["params"])

                    if response.status_code == 200:
                        data = response.json()

                        # Extract video URL based on service
                        video_url = None
                        metadata = {}

                        if service["name"] == "tikwm" and data.get("data"):
                            video_data = data["data"]
                            video_url = video_data.get("hdplay") or video_data.get("play")
                            metadata = {
                                "title": video_data.get("title", ""),
                                "author": video_data.get("author", {}).get("unique_id", ""),
                                "duration": video_data.get("duration", 0),
                                "description": video_data.get("title", ""),
                            }

                        if video_url and self._download_video_file(video_url, output_path):
                            return {
                                "success": True,
                                "video_path": str(output_path),
                                "metadata": metadata,
                                "source": service["name"]
                            }

            except Exception as e:
                logger.warning(f"{service['name']} API failed: {e}")
                continue

        return None

    def download(self, url: str) -> Dict[str, Any]:
        """
        Download TikTok video and extract metadata

        Args:
            url: TikTok video URL

        Returns:
            Dict with success status, video_path, and metadata
        """
        video_id = self._extract_video_id(url) or uuid.uuid4().hex[:12]
        output_filename = f"{video_id}_{int(time.time())}.mp4"
        output_path = self.storage_path / output_filename

        logger.info(f"Downloading video from: {url}")

        # Try API download first (faster and more reliable)
        api_result = self._try_api_download(url, output_path)
        if api_result:
            logger.info(f"Downloaded via API: {output_path}")
            return api_result

        # Fallback to Playwright browser automation
        logger.info("API download failed, trying browser automation...")

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                    ]
                )

                context = browser.new_context(
                    user_agent=self.user_agent,
                    viewport={"width": 1920, "height": 1080},
                    locale="en-US",
                )

                page = context.new_page()

                # Set up request interception to capture video URLs
                video_urls = []

                def handle_response(response):
                    if "video" in response.url and ".mp4" in response.url:
                        video_urls.append(response.url)

                page.on("response", handle_response)

                # Navigate to page
                page.goto(url, wait_until="networkidle", timeout=self.timeout)
                time.sleep(3)

                # Extract metadata
                metadata = self._get_video_metadata(page, url)

                # Get video URL
                video_url = self._get_video_url(page)

                # Also check intercepted URLs
                if not video_url and video_urls:
                    video_url = video_urls[0]

                browser.close()

                if video_url:
                    if self._download_video_file(video_url, output_path):
                        logger.info(f"Downloaded via browser: {output_path}")
                        return {
                            "success": True,
                            "video_path": str(output_path),
                            "metadata": metadata,
                            "source": "browser"
                        }

                return {
                    "success": False,
                    "error": "Could not extract video URL",
                    "metadata": metadata
                }

        except Exception as e:
            logger.error(f"Browser download failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }


if __name__ == "__main__":
    # Test
    logging.basicConfig(level=logging.INFO)
    downloader = TikTokDownloader(storage_path="./test_downloads")
    result = downloader.download("https://www.tiktok.com/@tiktok/video/7326389754498695471")
    print(json.dumps(result, indent=2))
