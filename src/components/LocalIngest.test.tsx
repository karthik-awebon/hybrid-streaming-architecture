/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
  version: '2.14.305',
}));

import { LocalIngest } from './LocalIngest';
import { useEmbedding } from '@/hooks/useEmbedding';
import { oramaDB } from '@/lib/orama-db';

vi.mock('@/hooks/useEmbedding');
vi.mock('@/lib/orama-db', () => ({
  oramaDB: {
    insert: vi.fn(),
    clear: vi.fn(),
  },
}));
vi.mock('@/utils/document-parser');

describe('LocalIngest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when ready', () => {
    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      progress: null,
      generateEmbedding: vi.fn(),
    } as any);

    render(<LocalIngest />);
    expect(screen.getByText('Local Data Ingestion')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste text here/i)).toBeInTheDocument();
  });

  it('handles text ingestion', async () => {
    const generateEmbedding = vi.fn().mockResolvedValue([0.1, 0.2]);
    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      progress: null,
      generateEmbedding,
    } as any);

    render(<LocalIngest />);

    const textarea = screen.getByPlaceholderText(/Paste text here/i);
    fireEvent.change(textarea, { target: { value: 'Test content for ingestion' } });

    const ingestButton = screen.getByText('Add to Local Index');
    fireEvent.click(ingestButton);

    await waitFor(() => {
      expect(generateEmbedding).toHaveBeenCalled();
      expect(oramaDB.insert).toHaveBeenCalled();
      expect(screen.getByText(/Successfully ingested/i)).toBeInTheDocument();
    });
  });

  it('disables input when not ready', () => {
    vi.mocked(useEmbedding).mockReturnValue({
      isReady: false,
      progress: { progress: 50, text: 'Loading', file: 'model.bin' },
      generateEmbedding: vi.fn(),
    } as any);

    render(<LocalIngest />);
    const textarea = screen.getByPlaceholderText(/Paste text here/i);
    expect(textarea).toBeDisabled();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('loads text into textarea on file upload', async () => {
    const { parseDocument } = await import('@/utils/document-parser');
    vi.mocked(parseDocument).mockResolvedValue('parsed file content');

    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      progress: null,
      generateEmbedding: vi.fn(),
    } as any);

    render(<LocalIngest />);

    const file = new File(['mock content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/Upload Document/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Paste text here/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('parsed file content');
      expect(screen.getByText(/Successfully loaded text/i)).toBeInTheDocument();
      expect(oramaDB.insert).not.toHaveBeenCalled();
    });
  });
});
