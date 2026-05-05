import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineSingleton {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  if (event.data.action === 'init') {
    try {
      await PipelineSingleton.getInstance((x: any) => {
        self.postMessage({ status: 'progress', ...x });
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
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      // The output.data is a Float32Array
      self.postMessage({ status: 'complete', id, vector: Array.from(output.data) });
    } catch (error) {
      self.postMessage({ status: 'error', id: event.data.id, error: (error as Error).message });
    }
  }
});
