import { describe, it, expect } from 'vitest';
import { ChatRequestSchema } from './chat';

describe('ChatRequestSchema', () => {
  it('should validate valid chat request', () => {
    const result = ChatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'hello' }],
      data: { embedding: [0.1, 0.2] },
    });
    expect(result.success).toBe(true);
  });

  it('should validate request without data', () => {
    const result = ChatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(result.success).toBe(true);
  });

  it('should fail if messages are missing', () => {
    const result = ChatRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
