/**
 * @fileoverview Script generation hook from AI analysis
 * @input AIAnalysis data from completed video analysis
 * @output Hook: { status, script, error, generateScript, updateScript, reset }
 * @pos Generates editable video scripts using Gemini AI or fallback rules
 */

'use client';

import { useState, useCallback } from 'react';
import { tiktokService } from '@/shared/services/tiktok';
import type {
  ScriptGenerationStatus,
  ScriptScene,
  GeneratedScript,
  AIAnalysis,
} from '@/types/tiktok';

// Re-export types for backward compatibility
export type { ScriptScene, GeneratedScript, ScriptGenerationStatus };

// Hook返回类型
export interface UseScriptGeneratorReturn {
  status: ScriptGenerationStatus;
  script: GeneratedScript | null;
  error: string | null;
  generateScript: (analysisData: AIAnalysis) => Promise<GeneratedScript | null>;
  updateScript: (updatedScript: GeneratedScript) => void;
  reset: () => void;
}

export function useScriptGenerator(): UseScriptGeneratorReturn {
  const [status, setStatus] = useState<ScriptGenerationStatus>('idle');
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setScript(null);
    setError(null);
  }, []);

  const generateScript = useCallback(async (analysisData: AIAnalysis): Promise<GeneratedScript | null> => {
    setStatus('generating');
    setError(null);

    try {
      const generatedScript = await tiktokService.generateScript(analysisData, true);

      setStatus('completed');
      setScript(generatedScript);

      return generatedScript;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus('failed');
      setError(errorMessage);
      return null;
    }
  }, []);

  const updateScript = useCallback((updatedScript: GeneratedScript) => {
    setScript(updatedScript);
  }, []);

  return {
    status,
    script,
    error,
    generateScript,
    updateScript,
    reset,
  };
}
