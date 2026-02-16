/**
 * @fileoverview TikTok business components barrel export
 * @input N/A
 * @output Exports: ScriptTimeline, SceneData, VideoPreview, ScriptEditor, VideoResult, ScriptViewer, StoryboardTable
 * @pos Entry point for all TikTok-specific UI components
 */

// TikTok 业务特定组件
export { ScriptTimeline } from './script-timeline';
export type { SceneData } from './script-timeline';
export { VideoPreview } from './video-preview';
export { ScriptEditor } from './script-editor';
export { VideoResult } from './video-result';

// Production Script 组件 (New)
export { ScriptViewer } from './script-viewer';
export { StoryboardTable } from './storyboard-table';
