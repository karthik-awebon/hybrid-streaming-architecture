'use client';

import React, { useState, useEffect } from 'react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { useWebLLM } from '@/hooks/useWebLLM';
import { oramaDB } from '@/lib/orama-db';
import { logger } from '@/utils/logger';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { SourceGrid } from '@/components/SourceGrid';
import { UIMessage as Message } from 'ai';
import { OramaSearchResult } from '@/types/local-rag';

export function LocalChat() {
  const { isReady: isEmbeddingReady, generateEmbedding } = useEmbedding();
  const {
    isReady: isLLMReady,
    status: llmStatus,
    progress: llmProgress,
    initialize: initializeLLM,
    chat: streamChat,
    stop: stopLLM,
  } = useWebLLM();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'Hello! I am your local AI assistant. I can answer questions based on the documents you have indexed in the Ingest panel.',
        },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<OramaSearchResult[]>([]);

  // Auto-initialize LLM if not ready
  useEffect(() => {
    if (llmStatus === 'uninitialized') {
      initializeLLM();
    }
  }, [llmStatus, initializeLLM]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isLLMReady || !isEmbeddingReady || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: input }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSources([]);

    try {
      logger.info('Performing semantic search for query:', input);
      const queryEmbedding = await generateEmbedding(input);
      const searchResults = await oramaDB.search(queryEmbedding, 3);
      setSources(searchResults);

      const context = searchResults.map((r) => r.text).join('\n\n');
      logger.debug('Context retrieved:', context);

      const prompt = context
        ? `Use the following context to answer the user's question. If the answer is not in the context, say you don't know based on the provided documents.\n\nContext:\n${context}\n\nQuestion: ${input}`
        : input;

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let fullResponse = '';
      for await (const chunk of streamChat([
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions based on provided context.',
        },
        { role: 'user', content: prompt },
      ])) {
        fullResponse += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, parts: [{ type: 'text', text: fullResponse }] }
              : msg
          )
        );
      }

      logger.info('Chat response complete');
    } catch (err) {
      logger.error('Chat failed', err);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Sorry, I encountered an error while processing your request.' },
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative">
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 text-purple-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
          Local Chat (RAG)
        </h2>
        <div className="flex gap-2">{/* Status indicators can go here */}</div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 pb-32">
        <MessageList messages={messages} isLoading={isLoading} />

        {!isLoading && sources.length > 0 && <SourceGrid sources={sources} />}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-slate-500 text-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              </div>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {!isLLMReady && llmProgress && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md w-full space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-blue-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Downloading Llama-3 Model</h3>
            <p className="text-slate-500 text-sm">{llmProgress.text}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-blue-600">
                <span>PROGRESS</span>
                <span>{llmProgress.progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${llmProgress.progress}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest">
              This only happens once. The model is stored in your browser&apos;s cache.
            </p>
          </div>
        </div>
      )}

      {llmStatus === 'error' && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md w-full space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-red-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">WebGPU Not Supported</h3>
            <p className="text-slate-500 text-sm">
              Your browser or hardware does not support WebGPU, which is required to run the LLM
              locally.
            </p>
            <button
              onClick={() => initializeLLM()}
              className="px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isReady={isLLMReady && isEmbeddingReady}
        isLoading={isLoading}
        onStop={stopLLM}
      />
    </div>
  );
}
