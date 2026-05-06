export interface EmbeddingProgress {
  file: string;
  progress: number;
}

export interface ProgressCallbackData {
  status: string;
  name: string;
  file: string;
  progress: number;
  loaded: number;
  total: number;
}

export type ProgressCallback = (progress: ProgressCallbackData) => void;
