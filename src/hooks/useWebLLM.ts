import { useState, useCallback, useRef } from 'react';
import {
  CreateMLCEngine,
  MLCEngine,
  ChatCompletionMessageParam,
  InitProgressReport,
} from '@mlc-ai/web-llm';
import { WebLLMStatus, WebLLMProgress, UseWebLLMReturn } from '@/types/web-llm';
import { WEBLLM_MODEL } from '@/constants';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

/**
 * Custom hook to manage the WebLLM engine integration.
 * Handles initialization, model downloading progress, and streaming chat completions.
 *
 * @returns An object conforming to the UseWebLLMReturn interface.
 */
export function useWebLLM(): UseWebLLMReturn {
  const [status, setStatus] = useState<WebLLMStatus>('uninitialized');
  const [progress, setProgress] = useState<WebLLMProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<MLCEngine | null>(null);

  /**
   * Initializes the WebLLM engine and downloads the model if necessary.
   */
  const initialize = useCallback(async () => {
    if (engineRef.current) {
      logger.debug('WebLLM engine already initialized');
      return;
    }

    setStatus('loading');
    setProgress({ progress: 0, text: 'Starting initialization...' });
    setError(null);

    try {
      const initProgressCallback = (report: InitProgressReport) => {
        const progressPercentage = Math.round(report.progress * 100);
        setProgress({
          progress: progressPercentage,
          text: report.text,
        });
        logger.debug(`WebLLM progress: ${report.text} (${progressPercentage}%)`);
      };

      engineRef.current = await CreateMLCEngine(WEBLLM_MODEL, {
        initProgressCallback,
      });

      setStatus('ready');
      setProgress(null);
      logger.info('WebLLM engine initialized successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error during initialization';
      setStatus('error');
      setError(errorMessage);
      logger.error('WebLLM initialization failed', err);
      // We don't re-throw here to allow the UI to handle the error state via the returned 'error' string
    }
  }, []);

  /**
   * Sends a chat request to the WebLLM engine and streams the response.
   *
   * @param messages - Array of chat messages.
   * @yields The next chunk of the response content.
   */
  const chat = useCallback(
    async function* (
      messages: ChatCompletionMessageParam[]
    ): AsyncGenerator<string, void, unknown> {
      if (!engineRef.current || status !== 'ready') {
        const errorMsg = 'WebLLM engine not ready. Please initialize it first.';
        logger.warn(errorMsg);
        throw new AppError(errorMsg, 400);
      }

      try {
        const chunks = await engineRef.current.chat.completions.create({
          messages,
          stream: true,
        });

        for await (const chunk of chunks) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during chat';
        logger.error('WebLLM chat error', err);
        throw new AppError(`WebLLM chat failed: ${errorMessage}`, 500, err);
      }
    },
    [status]
  );

  /**
   * Interrupts the current generation.
   */
  const stop = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.interruptGenerate();
      logger.info('WebLLM generation interrupted');
    }
  }, []);

  return {
    status,
    progress,
    isReady: status === 'ready',
    error,
    chat,
    initialize,
    stop,
  };
}
