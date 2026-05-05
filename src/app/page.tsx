'use client';

import { useChat } from '@ai-sdk/react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { FormEvent, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { ModelStatus } from '@/components/ModelStatus';

/**
 * Custom hook to encapsulate chat logic and message handling
 */
function useChatLogic() {
  const { isReady, progress, generateEmbedding } = useEmbedding();
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !isReady || isLoading) return;

    const userMessageText = input;
    setInput('');
    
    let embedding: number[] = [];
    try {
      embedding = await generateEmbedding(userMessageText);
    } catch (err) {
      console.error('Embedding error:', err);
    }

    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: userMessageText }],
    }, {
      body: { data: { embedding } }
    });
  }, [input, isReady, isLoading, generateEmbedding, sendMessage]);

  return {
    input,
    setInput,
    messages,
    status,
    isLoading,
    isReady,
    progress,
    handleSubmit
  };
}

export default function ChatPage() {
  const {
    input,
    setInput,
    messages,
    isLoading,
    isReady,
    progress,
    handleSubmit
  } = useChatLogic();

  return (
    <div className="flex flex-col w-full max-w-3xl min-h-screen mx-auto bg-white font-sans text-slate-900">
      <Header isReady={isReady} />

      <main className="flex-1 px-4 py-8 space-y-8 overflow-y-auto mb-32">
        <ModelStatus isReady={isReady} progress={progress} />
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
