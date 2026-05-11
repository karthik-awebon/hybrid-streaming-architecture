import { useState } from 'react';
import { useEmbedding } from '@/hooks/useEmbedding';
import { chunkText } from '@/utils/chunking';
import { upsertToPinecone } from '@/actions/ingest';
import { IngestRecord, IngestStatus, IngestLogic } from '@/types/ingest';
import { INGEST_CHUNK_SIZE, INGEST_CHUNK_OVERLAP } from '@/constants';
import { IngestSchema } from '@/schemas/ingest';
import { getErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';
import { parseDocument } from '@/utils/document-parser';

/**
 * Custom hook to manage the ingestion process.
 * Orchestrates text chunking, local embedding generation, and server-side vector storage.
 *
 * @returns An object conforming to the IngestLogic interface.
 */
export function useIngestLogic(): IngestLogic {
  const { isReady, progress, generateEmbedding } = useEmbedding();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<IngestStatus>('idle');
  const [message, setMessage] = useState('');

  /**
   * Orchestrates the full ingestion workflow:
   * 1. Validates input.
   * 2. Chunks the text.
   * 3. Generates embeddings for each chunk locally.
   * 4. Uploads embeddings and text to the vector database.
   */
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
      logger.error('Embedding generation failed', err);
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
      logger.error('Pinecone upsert failed', err);
      setStatus('error');
      setMessage(getErrorMessage(err));
    }
  };

  /**
   * Handles file selection, parsing, and populating the text area.
   */
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('chunking'); // Use chunking as a loading state for parsing
    setMessage(`Parsing ${file.name}...`);
    setText(''); // Clear existing text

    try {
      const parsedText = await parseDocument(file);

      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Trigger download of the Markdown file
        const blob = new Blob([parsedText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.pdf$/i, '.md');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus('idle');
        setMessage(
          `PDF converted to Markdown and downloaded. Please upload the .md file to ingest.`
        );
        logger.info(`PDF converted to Markdown and downloaded: ${file.name}`);
      } else {
        setText(parsedText);
        setStatus('idle');
        setMessage(`Successfully loaded text from ${file.name}.`);
        logger.info(`File loaded into ingest text area: ${file.name}`);
      }
    } catch (err) {
      logger.error('File parsing failed', { error: err, fileName: file.name });
      setStatus('error');
      setMessage(getErrorMessage(err));
    } finally {
      // Reset input so the same file can be selected again
      e.target.value = '';
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
    onFileChange,
  };
}
