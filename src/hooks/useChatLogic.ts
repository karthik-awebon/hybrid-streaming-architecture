import { useChat } from '@ai-sdk/react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { FormEvent, useState, useCallback, useRef, useEffect } from 'react';
import { ChatLogic } from '@/types/chat';
import { logger } from '@/utils/logger';

/**
 * Custom hook to encapsulate chat logic, including message handling and local embedding generation.
 * This hook integrates with the AI SDK and the local embedding worker.
 *
 * @returns An object conforming to the ChatLogic interface.
 */
export function useChatLogic(): ChatLogic {
  const { isReady, progress, generateEmbedding } = useEmbedding();
  const [input, setInput] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const { messages, sendMessage, status, error, stop } = useChat();
  const isLoading = status === 'submitted' || status === 'streaming';

  // Effect to capture first chunk arrival
  useEffect(() => {
    if (status === 'streaming' && startTimeRef.current && latency === null) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && lastMessage.parts && lastMessage.parts.length > 0) {
        setLatency(performance.now() - startTimeRef.current);
      }
    }
  }, [messages, status, latency]);

  /**
   * Handles the form submission for the chat.
   * Generates a local embedding for the user's query before sending it to the server.
   *
   * @param e - The form event.
   */
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || !isReady || isLoading) return;

      const userMessageText = input;
      setInput('');
      setLatency(null);
      startTimeRef.current = performance.now();

      let embedding: number[] = [];
      try {
        embedding = await generateEmbedding(userMessageText);
      } catch (err) {
        logger.error('Embedding error', err);
      }

      await sendMessage(
        {
          role: 'user',
          parts: [{ type: 'text', text: userMessageText }],
        },
        {
          body: { data: { embedding } },
        }
      );
    },
    [input, isReady, isLoading, generateEmbedding, sendMessage]
  );

  return {
    input,
    setInput,
    messages,
    status,
    isLoading,
    isReady,
    progress,
    handleSubmit,
    latency,
    error,
    stop,
  };
}
