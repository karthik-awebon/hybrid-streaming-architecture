import { UIMessage } from 'ai';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="p-4 bg-slate-50 rounded-2xl mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-slate-800">Welcome to Hybrid RAG</h2>
        <p className="mt-2 text-slate-500 max-w-sm">
          Ask anything. Your query is embedded locally in your browser before being sent to the AI.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {messages.map((m, idx) => (
        <MessageItem key={m.id || idx} message={m} />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
