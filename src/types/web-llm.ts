import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

/**
 * Status of the WebLLM engine.
 */
export type WebLLMStatus = 'uninitialized' | 'loading' | 'ready' | 'error';

/**
 * Progress information for WebLLM model download and initialization.
 */
export interface WebLLMProgress {
  /** Percentage of completion (0-100). */
  progress: number;
  /** Human-readable status message. */
  text: string;
}

/**
 * Interface for the useWebLLM hook.
 */
export interface UseWebLLMReturn {
  /** Current status of the WebLLM engine. */
  status: WebLLMStatus;
  /** Download and initialization progress. */
  progress: WebLLMProgress | null;
  /** Whether the engine is ready to handle requests. */
  isReady: boolean;
  /** Error message if status is 'error'. */
  error: string | null;
  /** Function to send a chat request and stream the response. */
  chat: (messages: ChatCompletionMessageParam[]) => AsyncGenerator<string, void, unknown>;
  /** Initialize the engine. */
  initialize: () => Promise<void>;
}
