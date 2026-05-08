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

  const handleIngest = async (content: string, fileName: string = 'pasted-text') => {
    setIsIngesting(true);
    setError(null);
    setSuccess(null);

    try {
      IngestSchema.parse(content);

      if (!isEmbeddingReady) {
        throw new AppError('Embedding model is not ready', 400);
      }

      logger.info(`Starting ingestion for: ${fileName}`);

      const chunks = chunkText(content);
      logger.debug(`Text split into ${chunks.length} chunks`);

      const records = await Promise.all(
        chunks.map(async (chunk, index) => {
          const embedding = await generateEmbedding(chunk);
          return {
            id: `${fileName}-${Date.now()}-${index}`,
            text: chunk,
            embedding,
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

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIngesting(true);
    setError(null);
    setSuccess(null);

    try {
      const parsedText = await parseDocument(file);
      await handleIngest(parsedText, file.name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse file';
      setError(errorMessage);
      logger.error('File parsing failed', { error: err, fileName: file.name });
      setIsIngesting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
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
          Local Ingest
        </h2>
        <ModelStatus isReady={isEmbeddingReady} progress={embeddingProgress} />{' '}
      </div>

      <div className="space-y-4 flex-grow flex flex-col">
        <div className="relative group">
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] resize-none"
            placeholder="Paste your text here to index it locally..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isIngesting || !isEmbeddingReady}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => handleIngest(text)}
            disabled={isIngesting || !isEmbeddingReady || !text.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            {isIngesting ? 'Ingesting...' : 'Ingest Text'}
          </button>

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
              className={`px-6 py-2.5 rounded-xl font-semibold border-2 border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 ${
                isIngesting || !isEmbeddingReady ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 9 9m-9-9v13.5"
                />
              </svg>
              Upload File
            </label>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-green-500"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.303-3.243a.75.75 0 0 1 .018 1.06l-5 5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.97 1.97 4.47-4.47a.75.75 0 0 1 1.06-.018Z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        {!isEmbeddingReady && embeddingProgress && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
            <div className="flex justify-between text-xs font-bold text-blue-600 uppercase tracking-wider">
              <span>Loading Embedding Model</span>
              <span>{embeddingProgress.progress}%</span>
            </div>
            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${embeddingProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
