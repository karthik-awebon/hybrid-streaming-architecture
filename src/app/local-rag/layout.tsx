import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local RAG Dashboard',
  description: '100% local RAG with WebLLM and Orama DB.',
};

export default function LocalRagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
