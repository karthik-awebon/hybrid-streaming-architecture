/**
 * Centralized constants and environment variable access.
 */

// Pinecone
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
export const PINECONE_INDEX = process.env.PINECONE_INDEX || 'test-index';
export const PINECONE_TOP_K = Number(process.env.NEXT_PUBLIC_PINECONE_TOP_K) || 3;

// Local Embedding Model (Transformers.js)
export const LOCAL_EMBEDDING_MODEL =
  process.env.NEXT_PUBLIC_LOCAL_EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
export const LOCAL_EMBEDDING_TASK = 'feature-extraction' as const;

// AI / LLM
export const DEFAULT_LLM_MODEL = process.env.NEXT_PUBLIC_DEFAULT_LLM_MODEL || 'gpt-4o-mini';
export const API_MAX_DURATION = Number(process.env.NEXT_PUBLIC_API_MAX_DURATION) || 30;

// Chunking
export const DEFAULT_CHUNK_SIZE = Number(process.env.NEXT_PUBLIC_DEFAULT_CHUNK_SIZE) || 200;
export const DEFAULT_CHUNK_OVERLAP = Number(process.env.NEXT_PUBLIC_DEFAULT_CHUNK_OVERLAP) || 20;

// Ingest specific (can be different from defaults)
export const INGEST_CHUNK_SIZE = Number(process.env.NEXT_PUBLIC_INGEST_CHUNK_SIZE) || 500;
export const INGEST_CHUNK_OVERLAP = Number(process.env.NEXT_PUBLIC_INGEST_CHUNK_OVERLAP) || 50;
