'use server';

import { Pinecone } from '@pinecone-database/pinecone';

export type IngestRecord = {
  text: string;
  embedding: number[];
};

export async function upsertToPinecone(records: IngestRecord[]) {
  try {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }

    if (!records || records.length === 0) {
      return { success: false, error: 'No records provided for ingestion.' };
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX || 'test-index';
    const index = pc.index(indexName);

    console.log(`[DEBUG] Preparing to upsert ${records.length} records to Pinecone...`);

    const vectors = records.map((record) => ({
      id: crypto.randomUUID(),
      values: record.embedding,
      metadata: { text: record.text },
    }));

    // In this version of the SDK, upsert expects an object with a 'records' property
    await index.upsert({
      records: vectors,
    });

    console.log(`[DEBUG] Successfully upserted ${vectors.length} vectors.`);
    return { success: true, count: vectors.length };
  } catch (error) {
    console.error('Pinecone upsert error:', error);
    return { success: false, error: (error as Error).message };
  }
}
