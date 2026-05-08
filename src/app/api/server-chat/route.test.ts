/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { Pinecone } from '@pinecone-database/pinecone';
import { streamText, embed } from 'ai';

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

// We need to mutate the openai object to also have a mock embedding function
import { openai } from '@ai-sdk/openai';
(openai as any).embedding = vi.fn().mockReturnValue('mocked-embedding-model');

vi.mock('@/constants', () => ({
  PINECONE_API_KEY: 'test-key',
  PINECONE_INDEX: 'test-index',
  PINECONE_TOP_K: 3,
  DEFAULT_LLM_MODEL: 'gpt-4o',
  API_MAX_DURATION: 30,
  SERVER_EMBEDDING_MODEL: 'text-embedding-3-small',
  SERVER_EMBEDDING_DIMENSIONS: 384,
}));

describe('Server Chat API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle request and generate server-side embedding', async () => {
    vi.mocked(embed).mockResolvedValue({
      embedding: [0.1, 0.2],
      usage: { tokens: 10 },
    } as any);

    const pc = new Pinecone({ apiKey: 'test-key' });
    const index = pc.index('test-index');
    vi.mocked(index.query).mockResolvedValue({
      matches: [{ id: '1', score: 0.9, metadata: { text: 'retrieved context from server' } }],
    } as any);

    const req = new Request('http://localhost/api/server-chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Tell me about the documents' }],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    // Verify embedding was called correctly
    expect(embed).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mocked-embedding-model',
        value: 'Tell me about the documents',
      })
    );

    // Verify Pinecone was queried with the embedding
    expect(index.query).toHaveBeenCalledWith({
      vector: [0.1, 0.2],
      topK: 3,
      includeMetadata: true,
    });

    // Check if system prompt was augmented
    const streamCall = vi.mocked(streamText).mock.calls[0];
    expect(streamCall?.[0]?.system).toContain('retrieved context from server');
  });

  it('should handle validation error', async () => {
    const req = new Request('http://localhost/api/server-chat', {
      method: 'POST',
      body: JSON.stringify({
        // Missing messages
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
