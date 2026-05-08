import { create, insert, search, save, load, AnyOrama } from '@orama/orama';
import { get, set, del } from 'idb-keyval';
import { logger } from '@/utils/logger';
import { DatabaseError } from '@/utils/errors';
import { OramaRecord, OramaSearchResult, OramaDBManager } from '@/types/local-rag';

const ORAMA_SNAPSHOT_KEY = 'orama-snapshot';

const SCHEMA = {
  id: 'string',
  text: 'string',
  embedding: 'vector[384]',
  metadata: {
    source: 'string',
    index: 'number',
    timestamp: 'string',
  },
} as const;

/**
 * Manager for the local Orama vector database.
 * Handles persistence using IndexedDB (idb-keyval).
 */
export class OramaDB implements OramaDBManager {
  private db: AnyOrama | null = null;

  /**
   * Initializes the Orama database.
   * Attempts to load a snapshot from IndexedDB first.
   */
  async initialize(): Promise<void> {
    try {
      if (this.db) return;

      const hasSnapshot = await this.loadSnapshot();
      if (hasSnapshot) {
        logger.info('Orama database initialized from snapshot');
        return;
      }

      this.db = await create({
        schema: SCHEMA,
      });
      logger.info('New Orama database instance created');
    } catch (error) {
      logger.error('Failed to initialize Orama database', { error });
      throw new DatabaseError('Failed to initialize Orama database', error);
    }
  }

  /**
   * Saves the current database state to IndexedDB.
   */
  async saveSnapshot(): Promise<void> {
    try {
      if (!this.db) {
        throw new DatabaseError('Database not initialized');
      }

      const snapshot = await save(this.db);
      await set(ORAMA_SNAPSHOT_KEY, snapshot);
      logger.info('Orama database snapshot saved');
    } catch (error) {
      logger.error('Failed to save Orama snapshot', { error });
      throw new DatabaseError('Failed to save Orama snapshot', error);
    }
  }

  /**
   * Loads the database state from IndexedDB.
   */
  async loadSnapshot(): Promise<boolean> {
    try {
      const snapshot = await get(ORAMA_SNAPSHOT_KEY);
      if (snapshot) {
        this.db = await create({
          schema: SCHEMA,
        });
        await load(this.db, snapshot);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to load Orama snapshot', { error });
      // Don't throw here, just return false so we can create a new one
      return false;
    }
  }

  /**
   * Inserts records into the database and saves a snapshot.
   */
  async insert(records: OramaRecord[]): Promise<void> {
    try {
      if (!this.db) {
        await this.initialize();
      }

      // Orama's insert returns the number of inserted documents
      await Promise.all(records.map((record) => insert(this.db!, record)));

      await this.saveSnapshot();
      logger.info(`Inserted ${records.length} records into Orama`);
    } catch (error) {
      logger.error('Failed to insert records into Orama', { error });
      throw new DatabaseError('Failed to insert records into Orama', error);
    }
  }

  /**
   * Searches the database using a vector embedding.
   */
  async search(embedding: number[], limit: number = 5): Promise<OramaSearchResult[]> {
    try {
      if (!this.db) {
        await this.initialize();
      }

      const results = await search(this.db!, {
        mode: 'vector',
        vector: {
          value: embedding,
          property: 'embedding',
        },
        limit,
      });

      return results.hits.map((hit) => {
        const doc = hit.document as unknown as OramaRecord;
        return {
          id: hit.id,
          text: doc.text,
          score: hit.score,
          metadata: doc.metadata,
        };
      });
    } catch (error) {
      logger.error('Orama search failed', { error });
      throw new DatabaseError('Orama search failed', error);
    }
  }

  /**
   * Clears the database and removes the snapshot from IndexedDB.
   */
  async clear(): Promise<void> {
    try {
      this.db = await create({
        schema: SCHEMA,
      });
      await del(ORAMA_SNAPSHOT_KEY);
      logger.info('Orama database cleared');
    } catch (error) {
      logger.error('Failed to clear Orama database', { error });
      throw new DatabaseError('Failed to clear Orama database', error);
    }
  }
}

// Export a singleton instance
export const oramaDB = new OramaDB();
