/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { Pinecone } from '@pinecone-database/pinecone';
import { streamText } from 'ai';

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
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(),
}));

vi.mock('@/constants', () => ({
  PINECONE_API_KEY: 'test-key',
  PINECONE_INDEX: 'test-index',
  PINECONE_TOP_K: 3,
  DEFAULT_LLM_MODEL: 'gpt-4o',
  API_MAX_DURATION: 30,
}));

describe('Chat API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle request without embedding', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(streamText).toHaveBeenCalled();
  });

  it('should perform vector search when embedding is provided', async () => {
    const pc = new Pinecone({ apiKey: 'test-key' });
    const index = pc.index('test-index');
    vi.mocked(index.query).mockResolvedValue({
      matches: [{ id: '1', score: 0.9, metadata: { text: 'retrieved context' } }],
    } as any);

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        data: { embedding: [0.1, 0.2] },
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(index.query).toHaveBeenCalledWith({
      vector: [0.1, 0.2],
      topK: 3,
      includeMetadata: true,
    });

    // Check if system prompt was augmented
    const streamCall = vi.mocked(streamText).mock.calls[0];
    expect(streamCall?.[0]?.system).toContain('retrieved context');
  });

  it('should handle validation error', async () => {
    const req = new Request('http://localhost/api/chat', {
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
