/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OramaDB } from './orama-db';
import * as orama from '@orama/orama';
import * as idbKeyval from 'idb-keyval';
import { DatabaseError } from '@/utils/errors';

// Mock dependencies
vi.mock('@orama/orama', () => ({
  create: vi.fn(),
  insert: vi.fn(),
  search: vi.fn(),
  save: vi.fn(),
  load: vi.fn(),
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('OramaDB', () => {
  let dbManager: OramaDB;

  beforeEach(() => {
    vi.clearAllMocks();
    dbManager = new OramaDB();
  });

  describe('initialize', () => {
    it('should create a new database if no snapshot exists', async () => {
      vi.mocked(idbKeyval.get).mockResolvedValue(null);
      vi.mocked(orama.create).mockResolvedValue({} as any);

      await dbManager.initialize();

      expect(orama.create).toHaveBeenCalled();
      expect(idbKeyval.get).toHaveBeenCalledWith('orama-snapshot');
    });

    it('should load from snapshot if one exists', async () => {
      const mockSnapshot = { data: 'snapshot' };
      vi.mocked(idbKeyval.get).mockResolvedValue(mockSnapshot);
      vi.mocked(orama.create).mockResolvedValue({} as any);
      vi.mocked(orama.load).mockResolvedValue(undefined as any);

      await dbManager.initialize();

      expect(orama.create).toHaveBeenCalled();
      expect(orama.load).toHaveBeenCalled();
    });

    it('should throw DatabaseError if create fails', async () => {
      vi.mocked(idbKeyval.get).mockResolvedValue(null);
      vi.mocked(orama.create).mockRejectedValue(new Error('Create failed'));

      await expect(dbManager.initialize()).rejects.toThrow(DatabaseError);
    });
  });

  describe('insert', () => {
    it('should insert records and save snapshot', async () => {
      vi.mocked(orama.create).mockResolvedValue({} as any);
      vi.mocked(orama.insert).mockResolvedValue('1' as any);
      vi.mocked(orama.save).mockResolvedValue({ data: 'snapshot' } as any);

      const records = [{ id: '1', text: 'test', embedding: [0.1, 0.2] }];

      await dbManager.insert(records);

      expect(orama.insert).toHaveBeenCalled();
      expect(orama.save).toHaveBeenCalled();
      expect(idbKeyval.set).toHaveBeenCalledWith('orama-snapshot', expect.any(Object));
    });
  });

  describe('search', () => {
    it('should return mapped search results', async () => {
      const mockResults = {
        hits: [
          {
            id: '1',
            score: 0.9,
            document: { text: 'found text', metadata: { source: 'test' } },
          },
        ],
      };

      vi.mocked(orama.create).mockResolvedValue({} as any);
      vi.mocked(orama.search).mockResolvedValue(mockResults as any);

      const results = await dbManager.search([0.1, 0.2]);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: '1',
        text: 'found text',
        score: 0.9,
        metadata: { source: 'test' },
      });
    });
  });

  describe('clear', () => {
    it('should recreate db and delete snapshot', async () => {
      vi.mocked(orama.create).mockResolvedValue({} as any);

      await dbManager.clear();

      expect(orama.create).toHaveBeenCalled();
      expect(idbKeyval.del).toHaveBeenCalledWith('orama-snapshot');
    });
  });
});
