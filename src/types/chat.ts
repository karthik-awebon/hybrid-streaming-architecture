import { UIMessage } from 'ai';
import { EmbeddingProgress } from './embedding';
import { FormEvent } from 'react';

export interface ChatLogic {
  input: string;
  setInput: (value: string) => void;
  messages: UIMessage[];
  status: string;
  isLoading: boolean;
  isReady: boolean;
  progress: EmbeddingProgress | null;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  latency: number | null;
}
