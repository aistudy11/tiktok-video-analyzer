# TikTok UI Components

Business-specific React components for the TikTok video analyzer workflow.

## File Manifest

| File | Responsibility | Role |
|------|----------------|------|
| `index.tsx` | Barrel export | Re-exports all TikTok components |
| `video-preview.tsx` | Video player | Displays original TikTok video with play/pause |
| `video-result.tsx` | Final result | Shows generated video with download/share controls |
| `script-editor.tsx` | Script editing | Full CRUD for script scenes with drag-and-drop |
| `script-timeline.tsx` | Timeline display | Read-only visualization of script structure |

## Dependencies

**Upstream (who uses these):**
- `TikTokTrendingClient` component (`app/[locale]/(landing)/tiktok-trending/client.tsx`)
- `tiktok-analyzer.tsx` block

**Downstream (what these depend on):**
- Shared UI: `GlassPanel` component
- Utility: `cn()` from `shared/lib/utils`
- Theme: `useTheme()` from `next-themes`
- Types: `GeneratedScript`, `ScriptScene` from `types/tiktok.ts`
- Icons: `lucide-react`

## Component Flow

```
Analysis Complete
       ↓
VideoPreview ─────→ ScriptEditor ─────→ VideoResult
(show original)     (edit script)       (show generated)
       │                  │
       └──────────────────┴── ScriptTimeline (read-only view)
```

## Theme Support

Components support the `titanium` theme with special styling:
- Scene numbers: `01`, `02` format vs `1`, `2`
- Different border radius and sizing
