import { MessageItemProps } from '@/types/components';

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.parts
            ?.filter((p) => p.type === 'text')
            .map((p) => ('text' in p ? p.text : ''))
            .join('')}
        </div>
      </div>
    </div>
  );
}
