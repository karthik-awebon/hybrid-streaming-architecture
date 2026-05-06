import { UIMessage } from 'ai';
import { EmbeddingProgress } from './embedding';
import { FormEvent } from 'react';

/**
 * Props for the MessageList component.
 */
export interface MessageListProps {
  /** Array of messages to display in the list. */
  messages: UIMessage[];
  /** Whether the chat is currently loading a response. */
  isLoading: boolean;
}

/**
 * Props for the MessageItem component.
 */
export interface MessageItemProps {
  /** The message object to display. */
  message: UIMessage;
}

/**
 * Props for the ChatInput component.
 */
export interface ChatInputProps {
  /** The current value of the input field. */
  input: string;
  /** Function to update the input field value. */
  setInput: (value: string) => void;
  /** Handler for the form submission. */
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Whether the embedding model is ready. */
  isReady: boolean;
  /** Whether a chat request is currently in progress. */
  isLoading: boolean;
}

/**
 * Props for the Header component.
 */
export interface HeaderProps {
  /** Whether the underlying models/services are ready. */
  isReady: boolean;
}

/**
 * Props for the ModelStatus component.
 */
export interface ModelStatusProps {
  /** Whether the embedding model is fully loaded and ready. */
  isReady: boolean;
  /** Current loading progress of the model, or null if not loading. */
  progress: EmbeddingProgress | null;
}
