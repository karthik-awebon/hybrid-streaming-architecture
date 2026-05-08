import { OramaRecord, FileIngestionPayload, OramaSearchResult } from '@/schemas/local-rag';

export type { OramaRecord, FileIngestionPayload, OramaSearchResult };

/**
 * Interface for the Orama Database Manager.
 */
export interface OramaDBManager {
  /** Initialize the database. */
  initialize(): Promise<void>;
  /** Save a snapshot of the database to persistent storage. */
  saveSnapshot(): Promise<void>;
  /** Load a snapshot of the database from persistent storage. */
  loadSnapshot(): Promise<boolean>;
  /** Insert multiple records into the database. */
  insert(records: OramaRecord[]): Promise<void>;
  /** Search the database using a vector embedding. */
  search(embedding: number[], limit?: number): Promise<OramaSearchResult[]>;
  /** Clear all data from the database. */
  clear(): Promise<void>;
}

/**
 * Status of the local vector database.
 */
export type OramaDBStatus = 'uninitialized' | 'loading' | 'ready' | 'error';
