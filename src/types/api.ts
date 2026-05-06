import { z } from 'zod';
import { ChatRequestSchema } from '@/schemas/chat';

/**
 * Type definition for the chat request body, inferred from the Zod schema.
 */
export type ChatRequestBody = z.infer<typeof ChatRequestSchema>;
