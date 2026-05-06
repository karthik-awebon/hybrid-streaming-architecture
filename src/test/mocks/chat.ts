/* eslint-disable @typescript-eslint/no-explicit-any */
import { UIMessage } from 'ai';

export const mockMessages: UIMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    parts: [{ type: 'text', text: 'Hello' }],
  } as any,
  {
    id: '2',
    role: 'assistant',
    content: 'Hi there!',
    createdAt: new Date('2024-01-01T00:00:01Z'),
    parts: [{ type: 'text', text: 'Hi there!' }],
  } as any,
];

export const mockChatRequest = {
  messages: mockMessages,
  data: {
    embedding: [0.1, 0.2, 0.3],
  },
};
