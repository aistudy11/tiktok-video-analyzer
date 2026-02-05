# Business Library

Application-specific utilities and stores for TikTok video analyzer.

## File Manifest

| File | Responsibility | Role |
|------|----------------|------|
| `video-task-store.ts` | Task storage | In-memory Map for video generation tasks with auto-cleanup |
| `tiktok-transformers.ts` | Data transformation | Backend-to-frontend data mapping utilities |

## Dependencies

**Upstream (who uses these):**
- `generate-video/route.ts` - creates and updates tasks
- `video-status/route.ts` - reads task status
- `status/route.ts` - uses transformers for data mapping

**Downstream (what these depend on):**
- Types: `VideoTask`, `AIAnalysis`, `VideoInfo` from `types/tiktok.ts`

## video-task-store.ts

Module-level singleton Map that persists across API routes in the same Node.js process.

**Features:**
- Auto-cleanup: Runs every 5 minutes, removes tasks older than 30 minutes
- Size limit: Maximum 1000 tasks to prevent memory issues
- Graceful: Cleanup interval doesn't block process exit

**Current Limitations:**
- Lost on server restart
- Single-instance only (not load-balanced compatible)

**Production Migration:**
- Option A: PostgreSQL via backend gateway
- Option B: Redis with TTL

**API:**
- `getTask(id)` - Get task by ID
- `setTask(id, task)` - Create/update task
- `deleteTask(id)` - Remove task
- `cleanupOldTasks(maxAgeMs)` - Remove tasks older than threshold
- `startAutoCleanup()` - Start auto-cleanup (runs on module load)
- `stopAutoCleanup()` - Stop auto-cleanup

## tiktok-transformers.ts

Pure functions for transforming backend API responses to frontend-compatible formats.

**Functions:**
- `parseJsonString(str)` - Parse JSON with markdown code block handling
- `transformAIAnalysis(data)` - Map backend AI fields to frontend format
- `transformVideoInfo(data, backendUrl, videoPath)` - Build VideoInfo from backend metadata
- `extractVideoFilename(path)` - Extract filename from path
- `extractTikTokUrlFromPath(path)` - Reconstruct TikTok URL from video path
