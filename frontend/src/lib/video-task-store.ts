/**
 * @fileoverview Video Task Store - In-Memory Task Storage
 * @description Shared storage for video generation tasks using module-level singleton Map.
 *
 * ## Current Implementation
 * Uses in-memory Map storage, suitable for development and single-instance deployments.
 * Tasks are shared across API routes within the same Node.js process.
 *
 * ## Limitations
 * - Tasks are lost on server restart
 * - Not suitable for multi-instance deployments (load-balanced)
 * - No persistence across deployments
 *
 * ## Production Migration Plan
 * When implementing Runway API integration, migrate to:
 * - Option A: Backend database (PostgreSQL) via backend gateway API
 * - Option B: Redis for distributed caching with TTL
 *
 * ## Why This Works
 * Next.js maintains module singletons across API routes in standalone output mode.
 * This is documented behavior for Docker deployments with `output: 'standalone'`.
 */

import type { VideoTask } from '@/types/tiktok';

// Module-level singleton Map for task storage
// This is shared across all API routes in the same Node.js process
const videoTaskStore = new Map<string, VideoTask>();

/**
 * Get a task by ID
 */
export function getTask(taskId: string): VideoTask | undefined {
  return videoTaskStore.get(taskId);
}

/**
 * Set/update a task
 */
export function setTask(taskId: string, task: VideoTask): void {
  videoTaskStore.set(taskId, task);
}

/**
 * Delete a task
 */
export function deleteTask(taskId: string): boolean {
  return videoTaskStore.delete(taskId);
}

/**
 * Check if a task exists
 */
export function hasTask(taskId: string): boolean {
  return videoTaskStore.has(taskId);
}

/**
 * Get all task IDs (for debugging)
 */
export function getAllTaskIds(): string[] {
  return Array.from(videoTaskStore.keys());
}

/**
 * Clean up old tasks (older than specified age in milliseconds)
 */
export function cleanupOldTasks(maxAgeMs: number = 30 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [taskId, task] of videoTaskStore.entries()) {
    if (now - task.created_at > maxAgeMs) {
      videoTaskStore.delete(taskId);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get store size (for debugging/monitoring)
 */
export function getStoreSize(): number {
  return videoTaskStore.size;
}

// Export the store directly for advanced use cases
export { videoTaskStore };

// ============================================
// Auto-cleanup Configuration
// ============================================

const AUTO_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_TASK_AGE_MS = 30 * 60 * 1000; // 30 minutes
const MAX_STORE_SIZE = 1000; // Maximum number of tasks to prevent memory issues

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start automatic cleanup of old tasks
 * Should be called once when the application starts
 */
export function startAutoCleanup(): void {
  if (cleanupIntervalId) {
    return; // Already running
  }

  cleanupIntervalId = setInterval(() => {
    const cleaned = cleanupOldTasks(MAX_TASK_AGE_MS);

    // If store is still too large after age-based cleanup, remove oldest tasks
    if (videoTaskStore.size > MAX_STORE_SIZE) {
      const tasksToRemove = videoTaskStore.size - MAX_STORE_SIZE;
      const sortedTasks = Array.from(videoTaskStore.entries())
        .sort((a, b) => a[1].created_at - b[1].created_at);

      for (let i = 0; i < tasksToRemove; i++) {
        videoTaskStore.delete(sortedTasks[i][0]);
      }
    }
  }, AUTO_CLEANUP_INTERVAL_MS);

  // Ensure cleanup doesn't prevent process exit
  if (cleanupIntervalId.unref) {
    cleanupIntervalId.unref();
  }
}

/**
 * Stop automatic cleanup
 * Should be called when shutting down the application
 */
export function stopAutoCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

/**
 * Check if auto-cleanup is running
 */
export function isAutoCleanupRunning(): boolean {
  return cleanupIntervalId !== null;
}

// Start auto-cleanup on module load
// This is safe because the module is only loaded once per Node.js process
startAutoCleanup();
