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
    expect(screen.getByText('Local Ingest')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste your text here/i)).toBeInTheDocument();
  });

  it('handles text ingestion', async () => {
    const generateEmbedding = vi.fn().mockResolvedValue([0.1, 0.2]);
    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      progress: null,
      generateEmbedding,
    } as any);

    render(<LocalIngest />);

    const textarea = screen.getByPlaceholderText(/Paste your text here/i);
    fireEvent.change(textarea, { target: { value: 'Test content for ingestion' } });

    const ingestButton = screen.getByText('Ingest Text');
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
      progress: { progress: 50, text: 'Loading' },
      generateEmbedding: vi.fn(),
    } as any);

    render(<LocalIngest />);
    const textarea = screen.getByPlaceholderText(/Paste your text here/i);
    expect(textarea).toBeDisabled();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
