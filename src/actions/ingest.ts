'use server';

import { Pinecone } from '@pinecone-database/pinecone';
import { IngestRecord } from '@/types/ingest';
import { PINECONE_API_KEY, PINECONE_INDEX } from '@/constants';
import { IngestRecordsSchema } from '@/schemas/ingest';

import { logger } from '@/utils/logger';

/**
 * Server Action to upsert generated embeddings and text metadata into Pinecone.
 * Validates the input records before processing.
 *
 * @param records - Array of records containing text and its corresponding vector embedding.
 * @returns A promise that resolves to an object indicating success and the count of upserted vectors, or an error message.
 */
export async function upsertToPinecone(records: IngestRecord[]) {
  try {
    const validation = IngestRecordsSchema.safeParse(records);
    if (!validation.success) {
      return { success: false, error: 'Invalid record format' };
    }

    if (!PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }

    if (!records || records.length === 0) {
      return { success: false, error: 'No records provided for ingestion.' };
    }

    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pc.index(PINECONE_INDEX);

    logger.debug(`Preparing to upsert ${records.length} records to Pinecone...`);

    const vectors = records.map((record) => ({
      id: crypto.randomUUID(),
      values: record.embedding,
      metadata: { text: record.text },
    }));

    // In this version of the SDK, upsert expects an object with a 'records' property
    await index.upsert({
      records: vectors,
    });

    logger.debug(`Successfully upserted ${vectors.length} vectors.`);
    return { success: true, count: vectors.length };
  } catch (error) {
    logger.error('Pinecone upsert error', error);
    return { success: false, error: (error as Error).message };
  }
}
