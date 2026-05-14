import { useChat } from '@ai-sdk/react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { useWebLLM } from '@/hooks/useWebLLM';
import { FormEvent, useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { oramaDB } from '@/lib/orama-db';
import { UIMessage } from 'ai';
import { OramaSearchResult } from '@/types/local-rag';
import { WebLLMProgress } from '@/types/web-llm';
import { generateId } from 'ai';

export type InferenceEngine = 'local' | 'server';

export interface UnifiedChatLogic {
  input: string;
  setInput: (value: string) => void;
  messages: UIMessage[];
  isLoading: boolean;
  isReady: boolean;
  engine: InferenceEngine | null;
  progress: WebLLMProgress | null;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  stop: () => void;
  sources: OramaSearchResult[];
  fallbackReason: string | null;
}

const CONFIDENCE_THRESHOLD = 0.6;
const FALLBACK_PHRASE = "i don't know based on the provided documents";

export function useUnifiedChatLogic(): UnifiedChatLogic {
  const { isReady: isEmbeddingReady, generateEmbedding } = useEmbedding();
  const {
    isReady: isLLMReady,
    status: llmStatus,
    progress: llmProgress,
    initialize: initializeLLM,
    chat: streamLocalChat,
    stop: stopLLM,
  } = useWebLLM();

  const [input, setInput] = useState('');
  const [sources, setSources] = useState<OramaSearchResult[]>([]);
  const [engine, setEngine] = useState<InferenceEngine | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);
  const localStreamAbortController = useRef<AbortController | null>(null);

  // useChat for the Server/Hybrid fallback
  const {
    messages: serverMessages,
    setMessages: setServerMessages,
    sendMessage: appendServer,
    status: serverStatus,
    stop: stopServer,
  } = useChat();

  const isLoading = isLocalLoading || serverStatus === 'submitted' || serverStatus === 'streaming';

  // Check capabilities on mount
  useEffect(() => {
    if (hasWebGPU === null) {
      const supported = typeof navigator !== 'undefined' && 'gpu' in navigator;
      // eslint-disable-next-line
      setHasWebGPU(supported);
    }

    if (hasWebGPU && llmStatus === 'uninitialized') {
      initializeLLM();
    }
  }, [llmStatus, initializeLLM, hasWebGPU]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      if (hasWebGPU && (!isLLMReady || !isEmbeddingReady)) return;

      const userQuery = input.trim();
      setInput('');
      setSources([]);
      setFallbackReason(null);

      // Clear previous local abort controller
      if (localStreamAbortController.current) {
        localStreamAbortController.current.abort();
      }
      localStreamAbortController.current = new AbortController();

      // Add user message to UI state immediately
      const userMessageId = generateId();
      const userMessage: UIMessage = {
        id: userMessageId,
        role: 'user',
        parts: [{ type: 'text', text: userQuery }],
      };

      // Update shared messages array
      setServerMessages([...serverMessages, userMessage]);

      const triggerServerFallback = async (reason: string, embedding?: number[]) => {
        logger.info(`Triggering server fallback. Reason: ${reason}`);
        setFallbackReason(reason);
        setEngine('server');
        setIsLocalLoading(true);

        // Let useChat handle the server call
        // We pass the user message via append. useChat will automatically add it,
        // so we need to pop the one we just manually added to avoid duplicates.
        setServerMessages((prev) => prev.filter((m) => m.id !== userMessageId));

        await appendServer(
          {
            role: 'user',
            parts: [{ type: 'text', text: userQuery }],
          },
          { body: { data: { embedding: embedding || [] } } }
        );
        setIsLocalLoading(false);
      };

      // 1. Hardware check fallback
      if (!hasWebGPU) {
        return triggerServerFallback('WebGPU not supported on this device');
      }

      setEngine('local');
      setIsLocalLoading(true);

      let embedding: number[] = [];
      try {
        embedding = await generateEmbedding(userQuery);
        const searchResults = await oramaDB.search(embedding, 3);
        setSources(searchResults);

        // 2. Confidence Gate 1: Context Relevance
        const topScore = searchResults.length > 0 ? (searchResults[0]?.score ?? 0) : 0;
        if (topScore < CONFIDENCE_THRESHOLD) {
          return triggerServerFallback('Low confidence in local context', embedding);
        }

        const context = searchResults.map((r) => r.text).join('\n\n');
        const prompt = context
          ? `Use the following context to answer the user's question. If the answer is not in the context, say you don't know based on the provided documents.\n\nContext:\n${context}\n\nQuestion: ${userQuery}`
          : userQuery;

        const assistantMessageId = generateId();
        const assistantMessage: UIMessage = {
          id: assistantMessageId,
          role: 'assistant',
          parts: [{ type: 'text', text: '' }],
        };

        setServerMessages((prev) => [...prev, assistantMessage]);

        let fullResponse = '';
        let fallbackTriggered = false;

        for await (const chunk of streamLocalChat([
          {
            role: 'system',
            content:
              'You are a helpful assistant that answers questions based on provided context.',
          },
          { role: 'user', content: prompt },
        ])) {
          if (localStreamAbortController.current?.signal.aborted) {
            break;
          }

          fullResponse += chunk;

          setServerMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, parts: [{ type: 'text', text: fullResponse }] }
                : msg
            )
          );

          // 3. Confidence Gate 2: Post-Generation Relevance
          if (fullResponse.toLowerCase().includes(FALLBACK_PHRASE)) {
            fallbackTriggered = true;
            stopLLM();
            localStreamAbortController.current.abort();
            break;
          }
        }

        if (fallbackTriggered) {
          // Remove the local assistant message before triggering fallback
          setServerMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
          return triggerServerFallback('Local model lacked knowledge', embedding);
        }
      } catch (err) {
        logger.error('Local chat failed, falling back to server', err);
        return triggerServerFallback('Local execution error', embedding);
      } finally {
        if (engine === 'local') {
          setIsLocalLoading(false);
        }
      }
    },
    [
      input,
      isLoading,
      isLLMReady,
      isEmbeddingReady,
      generateEmbedding,
      streamLocalChat,
      stopLLM,
      serverMessages,
      setServerMessages,
      appendServer,
      engine,
      hasWebGPU,
    ]
  );

  const stop = useCallback(() => {
    if (engine === 'local') {
      stopLLM();
      if (localStreamAbortController.current) {
        localStreamAbortController.current.abort();
      }
      setIsLocalLoading(false);
    } else {
      stopServer();
    }
  }, [engine, stopLLM, stopServer]);

  return {
    input,
    setInput,
    messages: serverMessages,
    isLoading,
    isReady: hasWebGPU ? isLLMReady && isEmbeddingReady : true,
    engine,
    progress: hasWebGPU ? llmProgress : null,
    handleSubmit,
    stop,
    sources,
    fallbackReason,
  };
}
