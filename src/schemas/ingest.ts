import { z } from 'zod';

export const IngestSchema = z.object({
  text: z.string().min(1, 'Text is required for ingestion'),
});

export const IngestRecordSchema = z.object({
  text: z.string(),
  embedding: z.array(z.number()),
});

export const IngestRecordsSchema = z.array(IngestRecordSchema);

export type IngestInput = z.infer<typeof IngestSchema>;
export type IngestRecordData = z.infer<typeof IngestRecordSchema>;
