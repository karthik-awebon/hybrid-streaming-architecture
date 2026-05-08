/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OramaDB } from './orama-db';

// Mock idb-keyval because indexedDB is not available in Node/JSDOM by default
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

/**
 * Integration test for OramaDB.
 * This test uses the REAL Orama library to ensure schema validation is working.
 */
describe('OramaDB Integration', () => {
  let dbManager: OramaDB;

  beforeEach(async () => {
    vi.clearAllMocks();
    dbManager = new OramaDB();
    await dbManager.clear(); // Resets to a clean state with the current SCHEMA
  });

  it('should successfully insert records matching the schema', async () => {
    const records = [
      {
        id: 'test-1',
        text: 'This is a test document.',
        embedding: new Array(384).fill(0),
        metadata: {
          source: 'test.pdf',
          index: 0,
          timestamp: new Date().toISOString(),
        },
      },
    ];

    await expect(dbManager.insert(records)).resolves.not.toThrow();
  });

  it('should fail when inserting records with mismatched metadata structure', async () => {
    const invalidRecords = [
      {
        id: 'test-2',
        text: 'Invalid metadata',
        embedding: new Array(384).fill(0),
        // This fails with the new schema because metadata is defined as an object
        metadata: 'this is a string, but schema expects an object' as any,
      },
    ];

    // With the real Orama engine, this throws a validation error
    await expect(dbManager.insert(invalidRecords)).rejects.toThrow();
  });

  it('should fail when embedding dimension is incorrect', async () => {
    const invalidRecords = [
      {
        id: 'test-3',
        text: 'Wrong vector size',
        embedding: [0.1, 0.2, 0.3], // Schema expects 384
        metadata: {
          source: 'test.pdf',
          index: 0,
          timestamp: new Date().toISOString(),
        },
      },
    ];

    await expect(dbManager.insert(invalidRecords)).rejects.toThrow();
  });
});
