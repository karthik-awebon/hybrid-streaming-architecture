import { ChatInputProps } from '@/types/components';

export function ChatInput({ input, setInput, onSubmit, isReady, isLoading }: ChatInputProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
        <div className="relative group flex items-center bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 transition-all duration-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
          <input
            className="w-full py-4 pl-6 pr-16 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
            value={input}
            placeholder={isReady ? 'How can I help you today?' : 'Preparing local AI model...'}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isReady || isLoading}
          />
          <button
            type="submit"
            disabled={!isReady || isLoading || !input.trim()}
            className="absolute right-3 p-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Client-Side Vector Generation Enabled
        </p>
      </form>
    </footer>
  );
}
