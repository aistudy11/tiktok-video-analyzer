/**
 * @fileoverview Production script generation hook (calls backend API)
 * @input Video analysis task ID
 * @output Hook: { status, script, error, generateScript, getScript, reset }
 * @pos Generates detailed production scripts using backend /api/v1/generate-script
 */

'use client';

import { useState, useCallback } from 'react';
import { tiktokService } from '@/shared/services/tiktok';
import type {
  ProductionScript,
  ProductionScriptStatus,
} from '@/types/tiktok';

// Re-export types
export type { ProductionScript, ProductionScriptStatus };

// Hook return type
export interface UseProductionScriptReturn {
  status: ProductionScriptStatus;
  script: ProductionScript | null;
  error: string | null;
  generateScript: (
    videoAnalysisId: string,
    scriptType?: 'full' | 'simple'
  ) => Promise<ProductionScript | null>;
  getScript: (videoAnalysisId: string) => Promise<ProductionScript | null>;
  reset: () => void;
}

export function useProductionScript(): UseProductionScriptReturn {
  const [status, setStatus] = useState<ProductionScriptStatus>('idle');
  const [script, setScript] = useState<ProductionScript | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setScript(null);
    setError(null);
  }, []);

  /**
   * Generate a new production script from video analysis
   */
  const generateScript = useCallback(
    async (
      videoAnalysisId: string,
      scriptType: 'full' | 'simple' = 'full'
    ): Promise<ProductionScript | null> => {
      setStatus('generating');
      setError(null);

      try {
        const response = await tiktokService.generateProductionScript(
          videoAnalysisId,
          scriptType
        );

        if (response.status === 'completed' && response.script) {
          setStatus('completed');
          setScript(response.script);
          return response.script;
        } else if (response.error) {
          throw new Error(response.error);
        } else {
          throw new Error('Failed to generate script');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setStatus('failed');
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  /**
   * Get existing production script by video analysis ID
   */
  const getScript = useCallback(
    async (videoAnalysisId: string): Promise<ProductionScript | null> => {
      setStatus('generating');
      setError(null);

      try {
        const response = await tiktokService.getProductionScript(videoAnalysisId);

        if (response.script) {
          setStatus('completed');
          setScript(response.script);
          return response.script;
        } else {
          throw new Error('Script not found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setStatus('failed');
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  return {
    status,
    script,
    error,
    generateScript,
    getScript,
    reset,
  };
}
