import { pipeline, env } from '@xenova/transformers';
import { ProgressCallback } from '@/types/embedding';
import { LOCAL_EMBEDDING_MODEL, LOCAL_EMBEDDING_TASK } from '@/constants';

// Skip local model check since we are running in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

/**
 * Singleton class to manage the Transformers.js pipeline instance.
 * Ensures only one instance of the model is loaded in the worker.
 */
class PipelineSingleton {
  static task = LOCAL_EMBEDDING_TASK;
  static model = LOCAL_EMBEDDING_MODEL;
  static instance: Awaited<ReturnType<typeof pipeline>> | null = null;

  /**
   * Retrieves or initializes the pipeline instance.
   *
   * @param progress_callback - Optional callback to track model loading progress.
   * @returns The pipeline instance.
   */
  static async getInstance(progress_callback?: ProgressCallback) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, {
        ...(progress_callback ? { progress_callback } : {}),
      });
    }
    return this.instance;
  }
}

/**
 * Listen for messages from the main thread.
 * Actions:
 * - 'init': Initialize the model and report progress.
 * - 'embed': Generate a vector embedding for the provided text.
 */
self.addEventListener('message', async (event) => {
  if (event.data.action === 'init') {
    try {
      await PipelineSingleton.getInstance((x) => {
        // x already contains status: 'progress' from Transformers.js
        self.postMessage(x);
      });
      self.postMessage({ status: 'ready' });
    } catch (error) {
      self.postMessage({ status: 'error', error: (error as Error).message });
    }
  }

  if (event.data.action === 'embed') {
    try {
      const { text, id } = event.data;
      const extractor = await PipelineSingleton.getInstance();

      // Generate embedding with mean pooling and normalization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await extractor(text, { pooling: 'mean', normalize: true } as any);

      // Extract data from the tensor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vector = Array.from((output as any).data as Float32Array);

      if (vector.length !== 384) {
        throw new Error(`Invalid embedding dimension: ${vector.length}. Expected 384.`);
      }

      self.postMessage({ status: 'complete', id, vector });
    } catch (error) {
      self.postMessage({ status: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
});
