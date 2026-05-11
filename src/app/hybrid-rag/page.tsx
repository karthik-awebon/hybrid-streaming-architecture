'use client';

import { useChatLogic } from '@/hooks/useChatLogic';
import { Header } from '@/components/Header';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { ModelStatus } from '@/components/ModelStatus';
import { ErrorMessage } from '@/components/ErrorMessage';
import { getErrorMessage } from '@/utils/error-handler';

/**
 * Main chat page component.
 * Provides the interface for interacting with the AI using local embeddings for RAG.
 */
export default function ChatPage() {
  const {
    input,
    setInput,
    messages,
    isLoading,
    isReady,
    progress,
    handleSubmit,
    latency,
    error,
    stop,
  } = useChatLogic();

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header isReady={isReady} />

      <div className="flex-1 w-full max-w-5xl mx-auto bg-white shadow-sm border-x border-slate-100">
        <main className="h-full px-4 py-8 space-y-8 overflow-y-auto mb-32">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-blue-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7.5h.008v.008H12V7.5Zm0 4.5h.008v.008H12V12Zm0 4.5h.008v.008H12v-.008ZM3 8.25c0-1.242 1.008-2.25 2.25-2.25h13.5c1.242 0 2.25 1.008 2.25 2.25v7.5c0 1.242-1.008 2.25-2.25 2.25H5.25C4.008 18 3 16.992 3 15.75v-7.5Z"
                />
              </svg>
              Hybrid RAG Chat
            </h2>
            <ModelStatus isReady={isReady} progress={progress} />
          </div>

          {error && <ErrorMessage message={getErrorMessage(error)} className="mx-4" />}

          {latency && (
            <div className="flex justify-center">
              <div className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-200">
                TTFT (Total): {latency.toFixed(0)}ms
              </div>
            </div>
          )}

          <MessageList messages={messages} isLoading={isLoading} />
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4">
        <div className="max-w-5xl mx-auto px-4">
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isReady={isReady}
            isLoading={isLoading}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
}
