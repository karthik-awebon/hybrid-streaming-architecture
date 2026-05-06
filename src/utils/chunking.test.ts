import { describe, it, expect } from 'vitest';
import { chunkText } from './chunking';

describe('chunkText', () => {
  it('should return an empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('should split text into chunks', () => {
    const text =
      'This is a long sentence that should be split into multiple chunks for processing.';
    const chunks = chunkText(text, 20, 0);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toBe('This is a long');
  });

  it('should handle paragraphs', () => {
    const text = 'Paragraph 1.\n\nParagraph 2.';
    // Force split by using a small chunk size
    const chunks = chunkText(text, 15, 0);
    expect(chunks).toContain('Paragraph 1.');
    expect(chunks).toContain('Paragraph 2.');
  });
});
