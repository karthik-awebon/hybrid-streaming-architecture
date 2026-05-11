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
  const { text, setText, status, message, isReady, progress, handleIngest, onFileChange } =
    useIngestLogic();

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header isReady={isReady} />

      <div className="flex-1 w-full max-w-5xl mx-auto bg-white shadow-sm border-x border-slate-100">
        <main className="px-4 py-8 space-y-8 mb-12">
          <ModelStatus isReady={isReady} progress={progress} />

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Ingest Data to Pinecone</h2>
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={onFileChange}
                  accept=".txt,.pdf,.docx"
                  disabled={
                    status === 'chunking' || status === 'embedding' || status === 'uploading'
                  }
                />
                <label
                  htmlFor="file-upload"
                  className={`text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1.5 transition-colors ${
                    status === 'chunking' || status === 'embedding' || status === 'uploading'
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 9 9m-9-9v13.5"
                    />
                  </svg>
                  Upload Document
                </label>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Paste large text below or upload a document. It will be chunked, embedded locally in
              your browser using the lightweight model, and then inserted into your Pinecone index.
            </p>

            <textarea
              className="w-full h-64 p-4 text-sm border border-slate-200 rounded-xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50"
              placeholder="Paste your document content here or upload a file..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={
                !isReady ||
                status === 'chunking' ||
                status === 'embedding' ||
                status === 'uploading'
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
    </div>
  );
}
