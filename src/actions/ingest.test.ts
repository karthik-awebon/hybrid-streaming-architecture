/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertToPinecone } from './ingest';
import { Pinecone } from '@pinecone-database/pinecone';

const mockUpsert = vi.fn();
const mockIndex = {
  upsert: mockUpsert,
};

vi.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: class {
      index = vi.fn().mockReturnValue(mockIndex);
    },
  };
});

vi.mock('@/constants', () => ({
  PINECONE_API_KEY: 'test-key',
  PINECONE_INDEX: 'test-index',
}));

describe('upsertToPinecone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub crypto.randomUUID if not available in environment
    if (!global.crypto) {
      (global as any).crypto = { randomUUID: () => 'test-uuid' };
    } else if (!global.crypto.randomUUID) {
      (global.crypto as any).randomUUID = () => 'test-uuid';
    }
  });

  it('should upsert records successfully', async () => {
    const records = [{ text: 'test', embedding: [0.1] }];
    const result = await upsertToPinecone(records);

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    const pc = new Pinecone({ apiKey: 'test-key' });
    const index = pc.index('test-index');
    expect(index.upsert).toHaveBeenCalledWith({
      records: [{ id: expect.any(String), values: [0.1], metadata: { text: 'test' } }],
    });
  });

  it('should return error for invalid records', async () => {
    const result = await upsertToPinecone([{ text: 123 } as any]);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid record format');
  });

  it('should return error for empty records', async () => {
    const result = await upsertToPinecone([]);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No records provided for ingestion.');
  });

  it('should handle pinecone errors', async () => {
    const pc = new Pinecone({ apiKey: 'test-key' });
    const index = pc.index('test-index');
    vi.mocked(index.upsert).mockRejectedValue(new Error('Pinecone connection failed'));

    const result = await upsertToPinecone([{ text: 'test', embedding: [0.1] }]);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Pinecone connection failed');
  });
});
