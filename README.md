# TikTok Video Analyzer

云端自动化系统，用于分析TikTok/抖音视频。

## 架构

```
iPhone (iOS快捷指令) → FastAPI Gateway (:8000) → Celery异步任务 → Skills → 飞书存储
```

## 功能

1. **视频下载** - Playwright无水印下载TikTok视频
2. **AI分析** - Gemini 2.5 Pro视频内容分析
3. **数据同步** - 飞书Bitable自动存储

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入你的API密钥
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 测试API

```bash
# 创建分析任务
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@user/video/123456"}'

# 查询任务状态
curl http://localhost:8000/api/v1/status/{task_id}
```

## API端点

### POST /api/v1/analyze

创建视频分析任务。

**请求体:**
```json
{
  "url": "https://www.tiktok.com/@user/video/123456",
  "callback_url": "https://your-webhook.com/callback",
  "analysis_prompt": "分析这个视频的营销价值",
  "sync_to_feishu": true
}
```

**响应:**
```json
{
  "task_id": "task_abc123",
  "status": "pending",
  "message": "Task created and queued for processing",
  "created_at": "2024-01-15T10:30:00"
}
```

### GET /api/v1/status/{task_id}

查询任务状态和结果。

**响应:**
```json
{
  "task_id": "task_abc123",
  "status": "completed",
  "progress": 100,
  "message": "Analysis completed successfully",
  "result": {
    "video_title": "...",
    "ai_analysis": "...",
    "recommendations": ["..."]
  },
  "feishu_record_id": "rec_xyz789"
}
```

## iOS快捷指令配置

1. 创建新快捷指令
2. 添加"获取剪贴板内容"动作
3. 添加"获取URL内容"动作:
   - URL: `http://your-server:8000/api/v1/analyze`
   - 方法: POST
   - 请求体: JSON `{"url": "剪贴板内容"}`
4. 添加"显示通知"动作显示task_id

## 飞书Bitable配置

### 必需字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| task_id | 文本 | 任务ID |
| url | 链接 | 视频链接 |
| video_title | 文本 | 视频标题 |
| author | 文本 | 作者 |
| duration | 数字 | 时长(秒) |
| description | 多行文本 | 描述 |
| hashtags | 文本 | 标签 |
| ai_analysis | 多行文本 | AI分析 |
| content_summary | 多行文本 | 内容摘要 |
| sentiment | 单选 | 情感(positive/neutral/negative) |
| engagement_prediction | 单选 | 互动预测(high/medium/low) |
| recommendations | 多行文本 | 建议 |
| created_at | 日期 | 创建时间 |

## 目录结构

```
tiktok-video-analyzer/
├── docker-compose.yml
├── .env.example
├── gateway/
│   ├── main.py              # FastAPI入口
│   ├── config.py            # 配置
│   ├── celery_app.py        # Celery配置
│   ├── models/              # Pydantic模型
│   ├── services/            # 业务服务
│   ├── tasks/               # Celery任务
│   ├── requirements.txt
│   └── Dockerfile
├── skills/
│   ├── video_download/      # 视频下载技能
│   ├── ai_analysis/         # AI分析技能
│   └── data_sync/           # 数据同步技能
├── openhands/
│   └── Dockerfile.runtime   # OpenHands运行时
└── storage/
    ├── videos/              # 下载的视频
    ├── analysis/            # 分析结果
    └── logs/                # 日志
```

## 开发

### 本地运行

```bash
# 安装依赖
cd gateway
pip install -r requirements.txt
playwright install chromium

# 启动Redis
docker run -d -p 6379:6379 redis:7-alpine

# 启动API
uvicorn main:app --reload

# 启动Worker (另一个终端)
celery -A celery_app worker --loglevel=info
```

### 运行测试

```bash
# 测试视频下载
python skills/video_download/download.py

# 测试AI分析 (需要GEMINI_API_KEY)
GEMINI_API_KEY=xxx python skills/ai_analysis/analyze.py /path/to/video.mp4

# 测试飞书同步 (需要FEISHU_*环境变量)
python skills/data_sync/bitable_sync.py
```

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| REDIS_URL | Redis连接URL | 是 |
| GEMINI_API_KEY | Google Gemini API密钥 | 是 |
| FEISHU_APP_ID | 飞书应用ID | 是 |
| FEISHU_APP_SECRET | 飞书应用密钥 | 是 |
| FEISHU_BITABLE_APP_TOKEN | Bitable应用Token | 是 |
| FEISHU_BITABLE_TABLE_ID | Bitable表格ID | 是 |

## License

MIT
