import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

type ProgressCallback = (progress: {
  status: string;
  name: string;
  file: string;
  progress: number;
  loaded: number;
  total: number;
}) => void;

class PipelineSingleton {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: Awaited<ReturnType<typeof pipeline>> | null = null;

  static async getInstance(progress_callback?: ProgressCallback) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, {
        ...(progress_callback ? { progress_callback } : {}),
      });
    }
    return this.instance;
  }
}

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
      // Use as any for the options because of type mismatches in the library's complex pipeline types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await extractor(text, { pooling: 'mean', normalize: true } as any);
      // The output.data is a Float32Array on a Tensor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vector = Array.from((output as any).data as Float32Array);
      self.postMessage({ status: 'complete', id, vector });
    } catch (error) {
      self.postMessage({ status: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
});
