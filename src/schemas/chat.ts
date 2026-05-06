import { z } from 'zod';

export const MessagePartSchema = z.object({
  type: z.enum(['text', 'image', 'tool-call', 'tool-result']),
  text: z.string().optional(),
  // Add other parts if needed for complex AI SDK messages
});

export const UIMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system', 'data']),
  content: z.string().optional(),
  parts: z.array(z.any()).optional(), // AI SDK parts are complex, using any for now or refining later
  createdAt: z.date().optional(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(z.any()), // Validating array of messages
  data: z
    .object({
      embedding: z.array(z.number()).optional(),
    })
    .optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
