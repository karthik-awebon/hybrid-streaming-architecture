import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hybrid RAG Chat',
  description: 'Chat with AI using local embeddings and remote Pinecone search.',
};

export default function HybridRagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
