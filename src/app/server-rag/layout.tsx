import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Server RAG Chat',
  description: 'Traditional server-side RAG implementation.',
};

export default function ServerRagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
