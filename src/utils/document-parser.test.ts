/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseDocument } from './document-parser';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ValidationError } from '@/utils/errors';

// Mock dependencies
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
  version: '5.7.284',
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('document-parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseDocument', () => {
    it('should parse TXT files', async () => {
      const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
      const result = await parseDocument(file);
      expect(result).toBe('hello world');
    });

    it('should throw ValidationError for unsupported types', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      await expect(parseDocument(file)).rejects.toThrow(ValidationError);
    });

    it('should parse DOCX files using mammoth', async () => {
      const file = new File(['mock content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: 'docx content', messages: [] });

      const result = await parseDocument(file);

      expect(mammoth.extractRawText).toHaveBeenCalled();
      expect(result).toBe('docx content');
    });

    it('should parse PDF files using pdfjs-dist', async () => {
      const file = new File(['mock content'], 'test.pdf', { type: 'application/pdf' });

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'pdf' }, { str: 'content' }],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as any);

      const result = await parseDocument(file);

      expect(pdfjsLib.getDocument).toHaveBeenCalled();
      expect(result).toBe('pdf content');
    });
  });
});
