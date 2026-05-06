import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { ChatRequestBody } from '@/types/api';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, data } = body;

    // Extract client-side generated embedding from custom data
    const embedding = data?.embedding;

    let augmentedSystemPrompt = 'You are a helpful AI assistant.';

    // If an embedding was provided and Pinecone keys exist, perform vector search
    if (embedding && embedding.length > 0 && process.env.PINECONE_API_KEY) {
      console.log(`[DEBUG] Received embedding with length: ${embedding.length}`);
      try {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const indexName = process.env.PINECONE_INDEX || 'test-index';
        const index = pc.index(indexName);

        console.log(`[DEBUG] Querying Pinecone index: ${indexName}...`);
        const queryResponse = await index.query({
          vector: embedding,
          topK: 3,
          includeMetadata: true,
        });

        console.log(`[DEBUG] Pinecone found ${queryResponse.matches.length} matches.`);

        const contexts = queryResponse.matches
          .map((match, idx) => {
            const text = (match.metadata?.text as string) || '';
            console.log(
              `[DEBUG] Match ${idx + 1} score: ${match.score?.toFixed(4)} | Content: ${text.substring(0, 100)}...`
            );
            return text;
          })
          .filter(Boolean)
          .join('\n\n---\n\n');

        if (contexts) {
          augmentedSystemPrompt += `\n\nUse the following retrieved context to answer the user's question:\n\n${contexts}`;
          console.log(`[DEBUG] Prompt successfully augmented with context.`);
        } else {
          console.log(`[DEBUG] No usable context found in matches.`);
        }
      } catch (pcError) {
        console.error('Pinecone querying error:', pcError);
        // Continue without context if Pinecone fails (graceful degradation)
      }
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: augmentedSystemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
