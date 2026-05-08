import { z } from 'zod';

/**
 * Zod schema for the local Orama database record.
 */
export const OramaRecordSchema = z.object({
  id: z.string(),
  text: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Zod schema for file ingestion payload.
 */
export const FileIngestionSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  chunks: z.array(z.string()),
});

/**
 * Zod schema for search results from Orama.
 */
export const OramaSearchResultSchema = z.object({
  id: z.string(),
  text: z.string(),
  score: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Type inferred from OramaRecordSchema. */
export type OramaRecord = z.infer<typeof OramaRecordSchema>;
/** Type inferred from FileIngestionSchema. */
export type FileIngestionPayload = z.infer<typeof FileIngestionSchema>;
/** Type inferred from OramaSearchResultSchema. */
export type OramaSearchResult = z.infer<typeof OramaSearchResultSchema>;
