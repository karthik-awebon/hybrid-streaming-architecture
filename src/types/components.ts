import { UIMessage } from 'ai';
import { EmbeddingProgress } from './embedding';
import { FormEvent } from 'react';

export interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export interface MessageItemProps {
  message: UIMessage;
}

export interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  isReady: boolean;
  isLoading: boolean;
}

export interface HeaderProps {
  isReady: boolean;
}

export interface ModelStatusProps {
  isReady: boolean;
  progress: EmbeddingProgress | null;
}
