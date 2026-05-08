import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, embed } from 'ai';
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
  SERVER_EMBEDDING_MODEL,
} from '@/constants';

/**
 * Configure the maximum duration for the streaming response.
 */
export const maxDuration = API_MAX_DURATION;

/**
 * POST handler for the server-chat API route.
 * Orchestrates the Server RAG workflow:
 * 1. Validates the incoming chat request.
 * 2. Generates an embedding for the user's latest message on the server using OpenAI.
 * 3. Uses the generated embedding to query Pinecone for relevant context.
 * 4. Augments the system prompt with retrieved context.
 * 5. Streams the AI response using the configured LLM.
 *
 * @param req - The incoming Request object.
 * @returns A streaming response for the AI SDK client.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parseResult = ChatRequestSchema.safeParse(json);

    if (!parseResult.success) {
      throw new ValidationError('Invalid request data', parseResult.error.format());
    }

    const { messages } = parseResult.data;

    // Extract the latest user message to generate its embedding
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userMessageText = lastUserMessage?.parts[0]!.text || '';

    let augmentedSystemPrompt = 'You are a helpful AI assistant.';

    // Generate embedding on the server and query Pinecone if keys exist
    if (userMessageText && PINECONE_API_KEY) {
      try {
        logger.debug(
          `Generating server-side embedding for message using ${SERVER_EMBEDDING_MODEL}...`
        );

        const { embedding } = await embed({
          model: openai.embedding(SERVER_EMBEDDING_MODEL),
          value: userMessageText,
          providerOptions: {
            openai: {
              dimensions: 384,
            },
          },
        });

        logger.debug(`Successfully generated embedding with length: ${embedding.length}`);

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
      } catch (ragError) {
        logger.error('Server RAG querying error', ragError);
        // Continue without context if embedding/Pinecone fails (graceful degradation)
      }
    }

    const result = streamText({
      model: openai(DEFAULT_LLM_MODEL),
      system: augmentedSystemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logger.error('Server Chat API Error', error);
    return createErrorResponse(error);
  }
}
