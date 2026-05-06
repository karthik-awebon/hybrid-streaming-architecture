import { z } from 'zod';
import { IngestRecordSchema } from '@/schemas/ingest';

import { EmbeddingProgress } from './embedding';

/**
 * Represents a record to be ingested, inferred from the Zod schema.
 */
export type IngestRecord = z.infer<typeof IngestRecordSchema>;

/**
 * Possible statuses for the ingestion process.
 */
export type IngestStatus = 'idle' | 'chunking' | 'embedding' | 'uploading' | 'success' | 'error';

/**
 * Interface representing the state and logic for the ingestion process.
 */
export interface IngestLogic {
  /** The raw text content to be ingested. */
  text: string;
  /** Function to update the text content. */
  setText: (value: string) => void;
  /** Current status of the ingestion workflow. */
  status: IngestStatus;
  /** Status or error message to display to the user. */
  message: string;
  /** Whether the ingestion system is ready for use. */
  isReady: boolean;
  /** Progress of the embedding operation during ingestion. */
  progress: EmbeddingProgress | null;
  /** Handler to initiate the ingestion process. */
  handleIngest: () => Promise<void>;
}
