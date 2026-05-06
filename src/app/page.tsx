'use client';

import { useChat } from '@ai-sdk/react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { FormEvent, useState, useCallback, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { ModelStatus } from '@/components/ModelStatus';
import { ChatLogic } from '@/types/chat';

/**
 * Custom hook to encapsulate chat logic and message handling
 */
function useChatLogic(): ChatLogic {
  const { isReady, progress, generateEmbedding } = useEmbedding();
  const [input, setInput] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const { messages, sendMessage, status } = useChat();
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
  };
}

export default function ChatPage() {
  const { input, setInput, messages, isLoading, isReady, progress, handleSubmit, latency } =
    useChatLogic();

  return (
    <div className="flex flex-col w-full max-w-3xl min-h-screen mx-auto bg-white font-sans text-slate-900">
      <Header isReady={isReady} />

      <main className="flex-1 px-4 py-8 space-y-8 overflow-y-auto mb-32">
        <ModelStatus isReady={isReady} progress={progress} />

        {latency && (
          <div className="flex justify-center">
            <div className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-200">
              TTFT (Total): {latency.toFixed(0)}ms
            </div>
          </div>
        )}

        <MessageList messages={messages} isLoading={isLoading} />
      </main>

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isReady={isReady}
        isLoading={isLoading}
      />
    </div>
  );
}
