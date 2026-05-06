import { z } from 'zod';
import { IngestRecordSchema } from '@/schemas/ingest';

export type IngestRecord = z.infer<typeof IngestRecordSchema>;

export type IngestStatus = 'idle' | 'chunking' | 'embedding' | 'uploading' | 'success' | 'error';
