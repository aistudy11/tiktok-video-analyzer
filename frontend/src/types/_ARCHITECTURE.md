# Type Definitions

TypeScript type definitions for business logic.

## File Manifest

| File | Responsibility | Role |
|------|----------------|------|
| `index.ts` | Base exports | ShipAny base type re-exports (DO NOT MODIFY) |
| `tiktok.ts` | TikTok types | All TikTok analyzer type definitions |

## Dependencies

**Upstream (who uses these):**
- All TikTok API routes
- All TikTok hooks
- All TikTok components
- TikTok service layer

**Downstream:**
- None (leaf dependency)

## tiktok.ts Categories

### Video Analysis
- `VideoInfo` - Extracted video metadata
- `AIAnalysis` - AI analysis results
- `AnalysisScene` - Scene breakdown
- `AnalysisResult` - Complete analysis response

### Script Generation
- `SceneType` - Scene type enum
- `ScriptScene` - Single script scene
- `GeneratedScript` - Complete script
- `ScriptGenerationInput/Response` - API types

### Video Generation
- `TaskStatus` - Async task states
- `VideoTask` - Task storage model
- `VideoGenerationRequest/Response` - API types
- `VideoStatusResponse` - Progress polling response

### Service Types
- `TikTokVideo` - Video from API
- `TrendingVideosResponse` - Paginated list
- `VideoAnalysisRequest/Response` - Analysis API

### Hook Status Enums
- `AnalysisStatus` - Analysis workflow states
- `ScriptGenerationStatus` - Script gen states
- `VideoGenerationStatus` - Video gen states
