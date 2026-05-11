import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Layout-Aware Ingestion',
  description:
    'Ingest complex documents with visual layout awareness into the Pinecone vector database.',
};

export default function IngestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
