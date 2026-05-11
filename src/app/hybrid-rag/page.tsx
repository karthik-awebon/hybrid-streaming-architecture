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
          <ModelStatus isReady={isReady} progress={progress} />

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
