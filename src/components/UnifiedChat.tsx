'use client';

import { useUnifiedChatLogic } from '@/hooks/useUnifiedChatLogic';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { SourceGrid } from '@/components/SourceGrid';

export function UnifiedChat() {
  const {
    input,
    setInput,
    messages,
    isLoading,
    isReady,
    engine,
    progress,
    handleSubmit,
    stop,
    sources,
    fallbackReason,
  } = useUnifiedChatLogic();

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
            className="w-6 h-6 text-indigo-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
          Smart Unified Chat
        </h2>
        <div className="flex gap-2">
          {engine && (
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${engine === 'local' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
            >
              {engine === 'local' ? 'Local AI' : 'Cloud AI'}
            </span>
          )}
        </div>
      </div>

      {fallbackReason && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 flex justify-between items-center">
          <span>Switched to Cloud: {fallbackReason}</span>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-4 pb-32">
        <MessageList messages={messages} isLoading={isLoading} />

        {!isLoading && sources.length > 0 && engine === 'local' && <SourceGrid sources={sources} />}
      </div>

      {!isReady && progress && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md w-full space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-indigo-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Initializing Local AI</h3>
            <p className="text-slate-500 text-sm">{progress.text}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-indigo-600">
                <span>PROGRESS</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isReady={isReady}
        isLoading={isLoading}
        onStop={stop}
      />
    </div>
  );
}
