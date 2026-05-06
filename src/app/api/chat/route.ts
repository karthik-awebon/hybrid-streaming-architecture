import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { ChatRequestSchema } from '@/schemas/chat';
import { createErrorResponse } from '@/utils/api-response';
import { ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import {
  PINECONE_API_KEY,
  PINECONE_INDEX,
  PINECONE_TOP_K,
  DEFAULT_LLM_MODEL,
  API_MAX_DURATION,
} from '@/constants';

// Allow streaming responses up to configured seconds
export const maxDuration = API_MAX_DURATION;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parseResult = ChatRequestSchema.safeParse(json);

    if (!parseResult.success) {
      throw new ValidationError('Invalid request data', parseResult.error.format());
    }

    const { messages, data } = parseResult.data;

    // Extract client-side generated embedding from custom data
    const embedding = data?.embedding;

    let augmentedSystemPrompt = 'You are a helpful AI assistant.';

    // If an embedding was provided and Pinecone keys exist, perform vector search
    if (embedding && embedding.length > 0 && PINECONE_API_KEY) {
      logger.debug(`Received embedding with length: ${embedding.length}`);
      try {
        const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
        const index = pc.index(PINECONE_INDEX);

        logger.debug(`Querying Pinecone index: ${PINECONE_INDEX}...`);
        const queryResponse = await index.query({
          vector: embedding,
          topK: PINECONE_TOP_K,
          includeMetadata: true,
        });

        logger.debug(`Pinecone found ${queryResponse.matches.length} matches.`);

        const contexts = queryResponse.matches
          .map((match, idx) => {
            const text = (match.metadata?.text as string) || '';
            logger.debug(
              `Match ${idx + 1} score: ${match.score?.toFixed(4)} | Content: ${text.substring(0, 100)}...`
            );
            return text;
          })
          .filter(Boolean)
          .join('\n\n---\n\n');

        if (contexts) {
          augmentedSystemPrompt += `\n\nUse the following retrieved context to answer the user's question:\n\n${contexts}`;
          logger.debug(`Prompt successfully augmented with context.`);
        } else {
          logger.debug(`No usable context found in matches.`);
        }
      } catch (pcError) {
        logger.error('Pinecone querying error', pcError);
        // Continue without context if Pinecone fails (graceful degradation)
      }
    }

    const result = streamText({
      model: openai(DEFAULT_LLM_MODEL),
      system: augmentedSystemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logger.error('Chat API Error', error);
    return createErrorResponse(error);
  }
}
