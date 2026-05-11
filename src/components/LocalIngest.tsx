'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useEmbedding } from '@/hooks/useEmbedding';
import { oramaDB } from '@/lib/orama-db';
import { parseDocument } from '@/utils/document-parser';
import { chunkText } from '@/utils/chunking';
import { logger } from '@/utils/logger';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ModelStatus } from '@/components/ModelStatus';
import { AppError } from '@/utils/errors';
import { INGEST_CHUNK_OVERLAP, INGEST_CHUNK_SIZE } from '@/constants';

const IngestSchema = z.string().min(1, 'Content cannot be empty');

export function LocalIngest() {
  const {
    isReady: isEmbeddingReady,
    progress: embeddingProgress,
    generateEmbedding,
  } = useEmbedding();
  const [text, setText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleIngest = async (content: string, fileName: string = 'pasted-text') => {
    setIsIngesting(true);
    setError(null);
    setSuccess(null);
    setShowConfirmClear(false);

    try {
      IngestSchema.parse(content);

      if (!isEmbeddingReady) {
        throw new AppError('Embedding model is not ready', 400);
      }

      logger.info(`Starting ingestion for: ${fileName}`);

      const chunks = chunkText(content, INGEST_CHUNK_SIZE, INGEST_CHUNK_OVERLAP);
      logger.debug(`Text split into ${chunks.length} chunks`);

      const records = await Promise.all(
        chunks.map(async (chunk, index) => {
          const embedding = await generateEmbedding(chunk);
          return {
            id: `${fileName}-${Date.now()}-${index}`,
            text: chunk,
            embedding: Array.from(new Float32Array(embedding)), // Ensure it's a clean array of floats
            metadata: {
              source: fileName,
              index,
              timestamp: new Date().toISOString(),
            },
          };
        })
      );

      await oramaDB.insert(records);

      setSuccess(`Successfully ingested ${chunks.length} chunks from ${fileName}`);
      setText('');
      logger.info(`Ingestion complete for: ${fileName}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ingest content';
      setError(errorMessage);
      logger.error('Ingestion failed', { error: err, fileName });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleClear = async () => {
    setError(null);
    setSuccess(null);
    setIsIngesting(true);
    try {
      await oramaDB.clear();
      setSuccess('Local index cleared successfully');
      setShowConfirmClear(false);
      logger.info('Local index cleared');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear index';
      setError(errorMessage);
      logger.error('Clearing index failed', { error: err });
    } finally {
      setIsIngesting(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIngesting(true);
    setError(null);
    setSuccess(null);

    try {
      const parsedText = await parseDocument(file);
      setText(parsedText);
      setSuccess(`Successfully loaded text from ${file.name}. You can now review and ingest it.`);
      logger.info(`File loaded into textarea: ${file.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse file';
      setError(errorMessage);
      logger.error('File parsing failed', { error: err, fileName: file.name });
    } finally {
      setIsIngesting(false);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md h-full flex flex-col">
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-blue-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7.5h.008v.008H12V7.5Zm0 4.5h.008v.008H12V12Zm0 4.5h.008v.008H12v-.008ZM3 8.25c0-1.242 1.008-2.25 2.25-2.25h13.5c1.242 0 2.25 1.008 2.25 2.25v7.5c0 1.242-1.008 2.25-2.25 2.25H5.25C4.008 18 3 16.992 3 15.75v-7.5Z"
                />
              </svg>
            </div>
            Data Ingestion
          </h2>
          <ModelStatus isReady={isEmbeddingReady} progress={embeddingProgress} />
        </div>
        <p className="text-slate-500 text-sm mt-2">
          Add documents to your local vector database. All processing happens entirely in your
          browser.
        </p>
      </div>

      <div className="space-y-6 flex-grow flex flex-col">
        {/* Input Section */}
        <div className="flex flex-col gap-3 flex-grow">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Document Content
            </label>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={onFileChange}
                accept=".txt,.pdf,.docx"
                disabled={isIngesting || !isEmbeddingReady}
              />
              <label
                htmlFor="file-upload"
                className={`text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1.5 transition-colors ${
                  isIngesting || !isEmbeddingReady ? 'opacity-50 cursor-not-allowed' : ''
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
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all flex-grow min-h-[250px] resize-none text-sm leading-relaxed"
            placeholder="Paste text here or upload a file to begin indexing..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isIngesting || !isEmbeddingReady}
          />
        </div>

        {/* Actions Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => handleIngest(text)}
              disabled={isIngesting || !isEmbeddingReady || !text.trim()}
              className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all duration-200 shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2"
            >
              {isIngesting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add to Local Index
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              {!showConfirmClear ? (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  disabled={isIngesting}
                  className="px-4 py-3.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group border border-transparent hover:border-red-100"
                  title="Clear all indexed data"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 p-1 bg-red-50 rounded-xl border border-red-100">
                  <button
                    onClick={handleClear}
                    className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-3 py-2 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all"
                  >
                    Esc
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            {error && <ErrorMessage message={error} />}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-1 bg-emerald-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-emerald-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.303-3.243a.75.75 0 0 1 .018 1.06l-5 5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.97 1.97 4.47-4.47a.75.75 0 0 1 1.06-.018Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="font-medium">{success}</span>
              </div>
            )}

            {!isEmbeddingReady && embeddingProgress && (
              <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                  <span>Optimizing Engine</span>
                  <span>{embeddingProgress.progress}%</span>
                </div>
                <div className="h-1.5 bg-blue-100/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-700 ease-out"
                    style={{ width: `${embeddingProgress.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-400 text-center italic font-medium">
                  {embeddingProgress.file}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
