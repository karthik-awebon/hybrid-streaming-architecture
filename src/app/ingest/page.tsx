'use client';

import { useIngestLogic } from '@/hooks/useIngestLogic';
import { Header } from '@/components/Header';
import { ModelStatus } from '@/components/ModelStatus';
import { ErrorMessage } from '@/components/ErrorMessage';

/**
 * Page component for ingesting raw text into the Pinecone vector database.
 * Handles the UI for pasting text and monitoring the ingestion progress.
 */
export default function IngestPage() {
  const { text, setText, status, message, isReady, progress, handleIngest } = useIngestLogic();

  return (
    <div className="flex flex-col w-full max-w-3xl min-h-screen mx-auto bg-white font-sans text-slate-900">
      <Header isReady={isReady} />

      <main className="flex-1 px-4 py-8 space-y-8 mb-12">
        <ModelStatus isReady={isReady} progress={progress} />

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">Ingest Data to Pinecone</h2>
          <p className="text-sm text-slate-500 mb-6">
            Paste large text below. It will be chunked, embedded locally in your browser using the
            lightweight model, and then inserted into your Pinecone index.
          </p>

          <textarea
            className="w-full h-64 p-4 text-sm border border-slate-200 rounded-xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50"
            placeholder="Paste your document or large text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={
              !isReady || status === 'chunking' || status === 'embedding' || status === 'uploading'
            }
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm font-medium">
              {status === 'error' ? (
                <ErrorMessage message={message} />
              ) : status !== 'idle' ? (
                <span
                  className={
                    status === 'success' ? 'text-emerald-600' : 'text-blue-600 animate-pulse'
                  }
                >
                  {message}
                </span>
              ) : null}
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
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
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
