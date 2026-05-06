import { UIMessage } from 'ai';

export interface ChatRequestBody {
  messages: UIMessage[];
  data?: {
    embedding?: number[];
  };
}
