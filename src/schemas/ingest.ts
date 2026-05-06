import { z } from 'zod';

/**
 * Zod schema for ingestion input validation.
 */
export const IngestSchema = z.object({
  /** The text content to be ingested. Must be at least 1 character. */
  text: z.string().min(1, 'Text is required for ingestion'),
});

/**
 * Zod schema for a single ingestion record with its embedding.
 */
export const IngestRecordSchema = z.object({
  /** The original text content of the chunk. */
  text: z.string(),
  /** The computed vector embedding for the text. */
  embedding: z.array(z.number()),
});

/**
 * Zod schema for an array of ingestion records.
 */
export const IngestRecordsSchema = z.array(IngestRecordSchema);

/** Type inferred from IngestSchema. */
export type IngestInput = z.infer<typeof IngestSchema>;
/** Type inferred from IngestRecordSchema. */
export type IngestRecordData = z.infer<typeof IngestRecordSchema>;
