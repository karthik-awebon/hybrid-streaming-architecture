import { z } from 'zod';

/**
 * Zod schema for a part of a UI message.
 */
export const MessagePartSchema = z.object({
  type: z.enum(['text', 'image', 'tool-call', 'tool-result']),
  text: z.string().optional(),
  // Add other parts if needed for complex AI SDK messages
});

/**
 * Zod schema for a UI message in the chat.
 */
export const UIMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system', 'data']),
  content: z.string().optional(),
  parts: z.array(z.any()).optional(), // AI SDK parts are complex, using any for now or refining later
  createdAt: z.date().optional(),
});

/**
 * Zod schema for the chat request body.
 */
export const ChatRequestSchema = z.object({
  messages: z.array(z.any()), // Validating array of messages
  data: z
    .object({
      embedding: z.array(z.number()).optional(),
    })
    .optional(),
});

/**
 * Type inferred from the ChatRequestSchema.
 */
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
