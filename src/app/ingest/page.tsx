'use client';

import { useState } from 'react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { Header } from '@/components/Header';
import { ModelStatus } from '@/components/ModelStatus';
import { chunkText } from '@/utils/chunking';
import { upsertToPinecone, IngestRecord } from '@/actions/ingest';

export default function IngestPage() {
  const { isReady, progress, generateEmbedding } = useEmbedding();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'chunking' | 'embedding' | 'uploading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleIngest = async () => {
    if (!text.trim() || !isReady) return;

    setStatus('chunking');
    setMessage('Chunking text...');

    // 1. Chunk the text
    const chunks = chunkText(text, 500, 50); // Adjust chunk size as needed

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
        setMessage(
          `Successfully inserted ${result.count} vectors into Pinecone.`,
        );
        setText(''); // Clear input on success
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Pinecone upsert failed:', err);
      setStatus('error');
      setMessage(`Upload failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className='flex flex-col w-full max-w-3xl min-h-screen mx-auto bg-white font-sans text-slate-900'>
      <Header isReady={isReady} />

      <main className='flex-1 px-4 py-8 space-y-8 mb-12'>
        <ModelStatus isReady={isReady} progress={progress} />

        <div className='bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm'>
          <h2 className='text-xl font-semibold mb-4 text-slate-800'>
            Ingest Data to Pinecone
          </h2>
          <p className='text-sm text-slate-500 mb-6'>
            Paste large text below. It will be chunked, embedded locally in your
            browser using the lightweight model, and then inserted into your
            Pinecone index.
          </p>

          <textarea
            className='w-full h-64 p-4 text-sm border border-slate-200 rounded-xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50'
            placeholder='Paste your document or large text here...'
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={
              !isReady ||
              status === 'chunking' ||
              status === 'embedding' ||
              status === 'uploading'
            }
          />

          <div className='mt-4 flex items-center justify-between'>
            <div className='text-sm font-medium'>
              {status !== 'idle' && (
                <span
                  className={
                    status === 'error'
                      ? 'text-red-500'
                      : status === 'success'
                        ? 'text-emerald-600'
                        : 'text-blue-600 animate-pulse'
                  }
                >
                  {message}
                </span>
              )}
            </div>

            <button
              onClick={handleIngest}
              disabled={
                !isReady ||
                !text.trim() ||
                status === 'chunking' ||
                status === 'embedding' ||
                status === 'uploading'
              }
              className='px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors'
            >
              {status === 'idle' || status === 'success' || status === 'error'
                ? 'Process & Ingest'
                : 'Processing...'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
