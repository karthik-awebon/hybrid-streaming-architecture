import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, data } = body;

    // Extract client-side generated embedding from custom data
    const embedding = data?.embedding as number[] | undefined;

    let augmentedSystemPrompt = "You are a helpful AI assistant.";

    // If an embedding was provided and Pinecone keys exist, perform vector search
    if (embedding && embedding.length > 0 && process.env.PINECONE_API_KEY) {
      try {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const indexName = process.env.PINECONE_INDEX || 'test-index';
        const index = pc.index(indexName);

        const queryResponse = await index.query({
          vector: embedding,
          topK: 3,
          includeMetadata: true,
        });

        const contexts = queryResponse.matches
          .map((match) => match.metadata?.text || '')
          .filter(Boolean)
          .join('\n\n---\n\n');

        if (contexts) {
          augmentedSystemPrompt += `\n\nUse the following retrieved context to answer the user's question:\n\n${contexts}`;
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
