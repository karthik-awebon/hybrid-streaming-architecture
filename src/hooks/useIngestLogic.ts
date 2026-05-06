import { useState } from 'react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { chunkText } from '@/utils/chunking';
import { upsertToPinecone } from '@/actions/ingest';
import { IngestRecord, IngestStatus, IngestLogic } from '@/types/ingest';
import { INGEST_CHUNK_SIZE, INGEST_CHUNK_OVERLAP } from '@/constants';
import { IngestSchema } from '@/schemas/ingest';
import { getErrorMessage } from '@/utils/error-handler';

export function useIngestLogic(): IngestLogic {
  const { isReady, progress, generateEmbedding } = useEmbedding();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<IngestStatus>('idle');
  const [message, setMessage] = useState('');

  const handleIngest = async () => {
    const validation = IngestSchema.safeParse({ text });
    if (!validation.success) {
      setStatus('error');
      setMessage(validation.error.issues[0]?.message || 'Invalid input');
      return;
    }

    if (!isReady) return;

    setStatus('chunking');
    setMessage('Chunking text...');

    // 1. Chunk the text
    const chunks = chunkText(text, INGEST_CHUNK_SIZE, INGEST_CHUNK_OVERLAP);

    if (chunks.length === 0) {
      setStatus('error');
      setMessage('No valid text chunks generated.');
      return;
    }

    setStatus('embedding');
    setMessage(`Generating embeddings for ${chunks.length} chunks locally...`);

    const records: IngestRecord[] = [];

    // 2. Generate embeddings sequentially to avoid overwhelming the worker/browser
    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk === undefined) continue;

        setMessage(`Embedding chunk ${i + 1} of ${chunks.length}...`);
        const embedding = await generateEmbedding(chunk);
        records.push({ text: chunk, embedding });
      }
    } catch (err) {
      console.error('Embedding generation failed:', err);
      setStatus('error');
      setMessage('Failed to generate embeddings.');
      return;
    }

    setStatus('uploading');
    setMessage('Uploading vectors to Pinecone via Server Action...');

    // 3. Upsert to Pinecone via Server Action
    try {
      const result = await upsertToPinecone(records);

      if (result.success) {
        setStatus('success');
        setMessage(`Successfully inserted ${result.count} vectors into Pinecone.`);
        setText(''); // Clear input on success
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Pinecone upsert failed:', err);
      setStatus('error');
      setMessage(getErrorMessage(err));
    }
  };

  return {
    text,
    setText,
    status,
    message,
    isReady,
    progress,
    handleIngest,
  };
}
