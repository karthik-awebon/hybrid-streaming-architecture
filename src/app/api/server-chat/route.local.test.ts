/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { Pinecone } from '@pinecone-database/pinecone';
import { streamText } from 'ai';
import { generateLocalEmbedding } from '@/lib/server-embeddings';

const mockQuery = vi.fn();
const mockIndex = {
  query: mockQuery,
};

vi.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: class {
      index = vi.fn().mockReturnValue(mockIndex);
    },
  };
});

vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('streaming data')),
  }),
  convertToModelMessages: vi.fn().mockImplementation(async (m) => m),
  embed: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn().mockImplementation(() => 'mocked-model') as any,
}));

vi.mock('@/lib/server-embeddings', () => ({
  generateLocalEmbedding: vi.fn(),
}));

vi.mock('@/constants', () => ({
  PINECONE_API_KEY: 'test-key',
  PINECONE_INDEX: 'test-index',
  PINECONE_TOP_K: 3,
  DEFAULT_LLM_MODEL: 'gpt-4o',
  API_MAX_DURATION: 30,
  SERVER_EMBEDDING_MODEL: 'text-embedding-3-small',
  SERVER_EMBEDDING_DIMENSIONS: 384,
  USE_LOCAL_EMBEDDING: true,
  LOCAL_EMBEDDING_MODEL: 'Xenova/all-MiniLM-L6-v2',
  LOCAL_EMBEDDING_TASK: 'feature-extraction',
}));

describe('Server Chat API Route with Local Embeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle request and generate local server-side embedding', async () => {
    const mockEmbedding = Array(384).fill(0.1);
    vi.mocked(generateLocalEmbedding).mockResolvedValue(mockEmbedding);

    const pc = new Pinecone({ apiKey: 'test-key' });
    const index = pc.index('test-index');
    vi.mocked(index.query).mockResolvedValue({
      matches: [{ id: '1', score: 0.9, metadata: { text: 'retrieved local context' } }],
    } as any);

    const req = new Request('http://localhost/api/server-chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'Local embedding test' }] }],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    // Verify local embedding was called
    expect(generateLocalEmbedding).toHaveBeenCalledWith('Local embedding test');

    // Verify Pinecone was queried with the local embedding
    expect(index.query).toHaveBeenCalledWith({
      vector: mockEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // Check if system prompt was augmented
    const streamCall = vi.mocked(streamText).mock.calls[0];
    expect(streamCall?.[0]?.system).toContain('retrieved local context');
  });
});
