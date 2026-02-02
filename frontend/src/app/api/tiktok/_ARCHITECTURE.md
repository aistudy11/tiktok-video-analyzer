# TikTok API Routes

Backend-for-frontend (BFF) layer that proxies requests to the Python backend gateway and handles frontend-specific transformations.

## File Manifest

| File | Responsibility | Role |
|------|----------------|------|
| `analyze/route.ts` | Submit video analysis | POST - validates URL, forwards to backend `/api/v1/analyze` |
| `status/route.ts` | Get analysis status | GET - polls backend, transforms AI response to frontend format |
| `trending/route.ts` | List trending videos | GET - fetches trending videos with pagination |
| `generate-script/route.ts` | Generate video script | POST - uses Gemini AI or fallback rules |
| `generate-video/route.ts` | Start video generation | POST - initiates Runway API (simulation mode) |
| `video-status/route.ts` | Get video gen progress | GET - returns task progress from in-memory store |

## Dependencies

**Upstream (who calls these):**
- Frontend hooks (`use-tiktok-analyze.ts`, `use-script-generator.ts`, `use-video-generator.ts`)
- Frontend service layer (`shared/services/tiktok.ts`)

**Downstream (what these depend on):**
- Backend gateway (`BACKEND_API_URL` - Python FastAPI)
- tikwm API (video/thumbnail URL fallback)
- Gemini API (script generation)
- In-memory task store (`lib/video-task-store.ts`)
- Type definitions (`types/tiktok.ts`)

## Validation

All routes use Zod schemas for input validation. Validation errors return HTTP 400 with structured error response:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```
