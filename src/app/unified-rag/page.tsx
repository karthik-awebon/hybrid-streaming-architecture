import { Metadata } from 'next';
import { UnifiedChat } from '@/components/UnifiedChat';

export const metadata: Metadata = {
  title: 'Unified Smart Chat',
  description:
    'Smart AI routing between Local RAG and Cloud RAG based on capabilities and confidence.',
};

export default function UnifiedRagPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 overflow-hidden">
        <UnifiedChat />
      </div>
    </div>
  );
}
