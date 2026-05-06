import { UIMessage } from 'ai';
import { EmbeddingProgress } from './embedding';
import { FormEvent } from 'react';

/**
 * Interface representing the state and logic for the chat functionality.
 */
export interface ChatLogic {
  /** Current value of the chat input field. */
  input: string;
  /** Function to update the chat input field value. */
  setInput: (value: string) => void;
  /** List of messages in the current chat session. */
  messages: UIMessage[];
  /** Current status message or state of the chat. */
  status: string;
  /** Whether a chat request is currently being processed. */
  isLoading: boolean;
  /** Whether the chat system (including models) is ready for use. */
  isReady: boolean;
  /** Current progress of model loading or embedding. */
  progress: EmbeddingProgress | null;
  /** Handler for submitting a new chat message. */
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  /** Latency of the last request in milliseconds. */
  latency: number | null;
  /** Any error that occurred during chat operations. */
  error: Error | undefined;
}
