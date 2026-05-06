/**
 * Represents the progress of an embedding operation.
 */
export interface EmbeddingProgress {
  /** The name of the file or model being processed. */
  file: string;
  /** The progress percentage (0-100). */
  progress: number;
}

/**
 * Detailed data provided by the progress callback during model loading.
 */
export interface ProgressCallbackData {
  /** Current status of the operation (e.g., 'progress', 'done'). */
  status: string;
  /** Name of the task. */
  name: string;
  /** File being processed. */
  file: string;
  /** Progress percentage for the current file. */
  progress: number;
  /** Amount of data loaded so far. */
  loaded: number;
  /** Total amount of data to be loaded. */
  total: number;
}

/**
 * Callback function type for monitoring embedding or loading progress.
 */
export type ProgressCallback = (progress: ProgressCallbackData) => void;
