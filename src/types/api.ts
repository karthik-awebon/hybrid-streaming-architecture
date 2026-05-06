import { z } from 'zod';
import { ChatRequestSchema } from '@/schemas/chat';

export type ChatRequestBody = z.infer<typeof ChatRequestSchema>;
