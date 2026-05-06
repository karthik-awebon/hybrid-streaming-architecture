import { useEffect, useRef, useState, useCallback } from 'react';
import { EmbeddingProgress } from '@/types/embedding';
import { logger } from '@/utils/logger';

export function useEmbedding() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState<EmbeddingProgress | null>(null);
  const resolvesRef = useRef<Record<string, (vector: number[]) => void>>({});
  const rejectsRef = useRef<Record<string, (error: Error) => void>>({});

  useEffect(() => {
    if (!workerRef.current) {
      // Initialize the worker.
      workerRef.current = new Worker(new URL('../lib/embedding-worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.onmessage = (event) => {
        const { status, id, vector, error, file, progress } = event.data;

        if (status === 'progress') {
          setProgress({ file, progress });
        } else if (status === 'ready') {
          setIsReady(true);
          setProgress(null);
        } else if (status === 'complete' && id) {
          if (resolvesRef.current[id]) {
            resolvesRef.current[id](vector);
            delete resolvesRef.current[id];
            delete rejectsRef.current[id];
          }
        } else if (status === 'error') {
          if (id && rejectsRef.current[id]) {
            rejectsRef.current[id](new Error(error));
            delete resolvesRef.current[id];
            delete rejectsRef.current[id];
          } else {
            logger.error('Worker error', { error });
          }
        }
      };

      // Trigger initialization logic
      workerRef.current.postMessage({ action: 'init' });
    }

    return () => {
      // Optional: workerRef.current?.terminate();
      // If we want a persistent background worker, we omit termination.
    };
  }, []);

  const generateEmbedding = useCallback((text: string): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = Math.random().toString(36).substring(7);
      resolvesRef.current[id] = resolve;
      rejectsRef.current[id] = reject;

      workerRef.current.postMessage({ action: 'embed', text, id });
    });
  }, []);

  return { isReady, progress, generateEmbedding };
}
