import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Gemini AI (APImart proxy)
    gemini_api_key: str = ""
    gemini_base_url: str = "https://api.apimart.ai"
    gemini_model: str = "gemini-2.0-flash-exp"

    # Feishu
    feishu_app_id: str = ""
    feishu_app_secret: str = ""
    feishu_bitable_app_token: str = ""
    feishu_bitable_table_id: str = ""

    # Notion
    notion_api_key: str = ""
    notion_database_id: str = ""

    # Storage paths
    storage_path: str = "/app/storage"
    video_storage_path: str = "/app/storage/videos"
    analysis_storage_path: str = "/app/storage/analysis"
    log_storage_path: str = "/app/storage/logs"

    # API
    api_secret_key: str = "default-secret-key"
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
