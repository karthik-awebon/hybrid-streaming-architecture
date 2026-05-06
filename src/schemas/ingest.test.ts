import { describe, it, expect } from 'vitest';
import { IngestSchema, IngestRecordSchema } from './ingest';

describe('IngestSchema', () => {
  it('should validate valid text', () => {
    const result = IngestSchema.safeParse({ text: 'Valid text' });
    expect(result.success).toBe(true);
  });

  it('should fail on empty text', () => {
    const result = IngestSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
    if (!result.success && result.error.issues[0]) {
      expect(result.error.issues[0].message).toBe('Text is required for ingestion');
    }
  });
});

describe('IngestRecordSchema', () => {
  it('should validate valid record', () => {
    const result = IngestRecordSchema.safeParse({
      text: 'Some text',
      embedding: [0.1, 0.2, 0.3],
    });
    expect(result.success).toBe(true);
  });

  it('should fail if embedding is missing', () => {
    const result = IngestRecordSchema.safeParse({
      text: 'Some text',
    });
    expect(result.success).toBe(false);
  });
});
