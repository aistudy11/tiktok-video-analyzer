# TikTok Video Analyzer

A comprehensive platform for analyzing TikTok videos with AI-powered insights, built as a monorepo combining a Next.js frontend with a Python FastAPI backend.

## Architecture

```
tiktok-video-analyzer/
│
├── backend/                    # Python FastAPI backend
│   ├── gateway/               # API gateway service
│   ├── skills/                # Feature modules
│   │   ├── ai_analysis/       # Gemini AI analysis
│   │   ├── data_sync/         # Feishu Bitable sync
│   │   └── video_download/    # Video downloader
│   └── Dockerfile
│
├── frontend/                   # Next.js frontend (from ShipAny)
│   ├── src/
│   │   ├── app/               # App router pages
│   │   ├── core/              # Auth, DB, RBAC
│   │   └── shared/            # Components & services
│   └── Dockerfile
│
├── docker-compose.yml         # Service orchestration
└── storage/                   # Local storage (dev)
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js web application |
| backend | 8000 | FastAPI REST API |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Cache & message queue |
| celery_worker | - | Async task processing |
| celery_beat | - | Scheduled tasks |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. **Clone and configure environment**

```bash
cd tiktok-video-analyzer
cp .env.example .env
# Edit .env with your API keys
```

2. **Start all services**

```bash
docker-compose up -d
```

3. **Initialize database**

```bash
# Run database migrations
docker-compose exec frontend npm run db:push

# Initialize RBAC roles and permissions
docker-compose exec frontend npm run rbac:init

# Create admin user (after registering through the UI)
docker-compose exec frontend npm run rbac:assign -- --email=admin@example.com --role=admin
```

4. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Features

### Frontend Features (from ShipAny)

- **Authentication**: Email/password, OAuth (Google, GitHub)
- **Admin Dashboard**: User management, roles, permissions
- **TikTok Analyzer**: Browse trending videos, analyze with AI
- **Payment System**: Stripe/PayPal integration (optional)
- **Internationalization**: English & Chinese support

### Backend Features

- **Video Download**: Watermark-free TikTok video downloading
- **AI Analysis**: Gemini 2.5 Pro powered video analysis
- **Data Sync**: Export results to Feishu Bitable
- **Task Queue**: Async processing with Celery

## API Endpoints

### Video Analysis

```bash
# Create analysis task
POST /api/v1/analyze
{
  "url": "https://www.tiktok.com/@user/video/123",
  "sync_to_feishu": true
}

# Get task status
GET /api/v1/status/{task_id}

# Cancel task
DELETE /api/v1/task/{task_id}
```

### Trending Videos

```bash
# Get trending videos
GET /api/v1/trending/videos?limit=20
```

## Environment Variables

### Required

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tiktok_analyzer

# Authentication
AUTH_SECRET=your-32-character-secret

# AI
GEMINI_API_KEY=your-gemini-api-key
```

### Optional

```env
# Feishu Integration
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_BITABLE_APP_TOKEN=
FEISHU_BITABLE_TABLE_ID=

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Payment
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
```

## Development

### Frontend Development

```bash
cd frontend
pnpm install
pnpm dev
```

### Backend Development

```bash
cd backend/gateway
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Run Celery Worker

```bash
cd backend/gateway
celery -A celery_app worker -l info
```

## Deployment

### Using Dokploy

1. Push code to your Git repository
2. Add PostgreSQL database in Dokploy
3. Configure environment variables
4. Deploy with docker-compose

### Production Environment Variables

```env
# Database (use Dokploy-provided URL)
DATABASE_URL=postgresql://...

# App URLs
AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
BACKEND_API_URL=http://backend:8000
```

## License

MIT License
