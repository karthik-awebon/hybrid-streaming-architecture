/**
 * Centralized constants and environment variable access.
 */

// Pinecone
/** API key for Pinecone database. */
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
/** Name of the Pinecone index to use. */
export const PINECONE_INDEX = process.env.PINECONE_INDEX || 'test-index';
/** Number of top matches to retrieve from Pinecone. */
export const PINECONE_TOP_K = Number(process.env.NEXT_PUBLIC_PINECONE_TOP_K) || 3;

// Local Embedding Model (Transformers.js)
/** Model name for local embedding generation. */
export const LOCAL_EMBEDDING_MODEL =
  process.env.NEXT_PUBLIC_LOCAL_EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
/** Task type for the Transformers.js pipeline. */
export const LOCAL_EMBEDDING_TASK = 'feature-extraction' as const;

// AI / LLM
/** Default LLM model identifier. */
export const DEFAULT_LLM_MODEL = process.env.NEXT_PUBLIC_DEFAULT_LLM_MODEL || 'gpt-4o-mini';
/** WebLLM model identifier for local browser-side inference. */
export const WEBLLM_MODEL =
  process.env.NEXT_PUBLIC_WEBLLM_MODEL || 'Llama-3.1-8B-Instruct-q4f32_1-MLC';
/** Maximum duration for API requests in seconds. */
export const API_MAX_DURATION = Number(process.env.NEXT_PUBLIC_API_MAX_DURATION) || 30;

// Chunking
/** Default character count for text chunks. */
export const DEFAULT_CHUNK_SIZE = Number(process.env.NEXT_PUBLIC_DEFAULT_CHUNK_SIZE) || 200;
/** Default character count for overlap between chunks. */
export const DEFAULT_CHUNK_OVERLAP = Number(process.env.NEXT_PUBLIC_DEFAULT_CHUNK_OVERLAP) || 20;

// Ingest specific (can be different from defaults)
/** Specific chunk size for the ingestion process. */
export const INGEST_CHUNK_SIZE = Number(process.env.NEXT_PUBLIC_INGEST_CHUNK_SIZE) || 500;
/** Specific overlap size for the ingestion process. */
export const INGEST_CHUNK_OVERLAP = Number(process.env.NEXT_PUBLIC_INGEST_CHUNK_OVERLAP) || 50;
