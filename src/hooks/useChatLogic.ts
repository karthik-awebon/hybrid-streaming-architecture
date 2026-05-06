import { useChat } from '@ai-sdk/react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { FormEvent, useState, useCallback, useRef, useEffect } from 'react';
import { ChatLogic } from '@/types/chat';

/**
 * Custom hook to encapsulate chat logic and message handling
 */
export function useChatLogic(): ChatLogic {
  const { isReady, progress, generateEmbedding } = useEmbedding();
  const [input, setInput] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const { messages, sendMessage, status, error } = useChat();
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
        console.error('Embedding error:', err);
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
  };
}
