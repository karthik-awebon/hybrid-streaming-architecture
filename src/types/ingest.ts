import { z } from 'zod';
import { IngestRecordSchema } from '@/schemas/ingest';

import { EmbeddingProgress } from './embedding';

export type IngestRecord = z.infer<typeof IngestRecordSchema>;

export type IngestStatus = 'idle' | 'chunking' | 'embedding' | 'uploading' | 'success' | 'error';

export interface IngestLogic {
  text: string;
  setText: (value: string) => void;
  status: IngestStatus;
  message: string;
  isReady: boolean;
  progress: EmbeddingProgress | null;
  handleIngest: () => Promise<void>;
}
