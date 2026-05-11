import { pipeline } from '@xenova/transformers';
import { LOCAL_EMBEDDING_MODEL, LOCAL_EMBEDDING_TASK } from '@/constants';
import { logger } from '@/utils/logger';

/**
 * Singleton class to manage the Transformers.js pipeline instance on the server.
 * Ensures only one instance of the model is loaded in the Node.js process.
 */
class ServerPipelineSingleton {
  static task = LOCAL_EMBEDDING_TASK;
  static model = LOCAL_EMBEDDING_MODEL;
  static instance: Awaited<ReturnType<typeof pipeline>> | null = null;

  /**
   * Retrieves or initializes the pipeline instance.
   *
   * @returns The pipeline instance.
   */
  static async getInstance() {
    if (this.instance === null) {
      logger.debug(`Initializing server-side Transformers.js pipeline with model: ${this.model}`);
      try {
        this.instance = await pipeline(this.task, this.model);
        logger.debug('Server-side pipeline initialized successfully.');
      } catch (error) {
        logger.error('Failed to initialize server-side pipeline', error);
        throw error;
      }
    }
    return this.instance;
  }
}

/**
 * Generates a vector embedding for the provided text using Transformers.js on the server.
 *
 * @param text - The text to embed.
 * @returns A promise that resolves to an array of numbers representing the embedding.
 */
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await ServerPipelineSingleton.getInstance();

    // Generate embedding with mean pooling and normalization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await extractor(text, { pooling: 'mean', normalize: true } as any);

    // Extract data from the tensor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vector = Array.from((output as any).data as Float32Array);

    if (vector.length !== 384) {
      throw new Error(`Invalid embedding dimension: ${vector.length}. Expected 384.`);
    }

    return vector;
  } catch (error) {
    logger.error('Error generating local server embedding', error);
    throw error;
  }
}
