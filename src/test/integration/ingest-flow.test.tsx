/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IngestPage from '@/app/ingest/page';
import { upsertToPinecone } from '@/actions/ingest';

// Mock Server Action
vi.mock('@/actions/ingest', () => ({
  upsertToPinecone: vi.fn(),
}));

// Mock Worker for useEmbedding
class MockWorker {
  onmessage: ((ev: any) => void) | null = null;
  postMessage = vi.fn((msg) => {
    if (msg.action === 'init') {
      setTimeout(() => this.onmessage?.({ data: { status: 'ready' } }), 0);
    } else if (msg.action === 'embed') {
      setTimeout(() => {
        this.onmessage?.({
          data: { status: 'complete', id: msg.id, vector: [0.1, 0.2, 0.3] },
        });
      }, 0);
    }
  });
  terminate = vi.fn();
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/ingest'),
}));

describe('Ingest Flow Integration', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', MockWorker);
    vi.stubGlobal('URL', vi.fn());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should complete the full ingestion flow from input to success', async () => {
    vi.mocked(upsertToPinecone).mockResolvedValue({ success: true, count: 1 });

    render(<IngestPage />);

    // 1. Wait for model to be ready
    await waitFor(() => {
      expect(screen.getByText('Model Ready')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Paste your document/);
    const button = screen.getByText('Process & Ingest');

    // 2. Enter text
    fireEvent.change(textarea, {
      target: { value: 'This is a test document for integration testing.' },
    });

    // 3. Click ingest
    fireEvent.click(button);

    // 4. Verify that it starts processing (one of the intermediate states)
    await waitFor(() => {
      expect(screen.getByText(/Chunking|Embedding|Uploading/)).toBeInTheDocument();
    });

    // 5. Verify final success state
    await waitFor(
      () => {
        expect(screen.getByText(/Successfully inserted 1 vectors/)).toBeInTheDocument();
        expect(textarea).toHaveValue('');
      },
      { timeout: 3000 }
    );

    expect(upsertToPinecone).toHaveBeenCalled();
  });

  it('should handle failures in the server action gracefully', async () => {
    vi.mocked(upsertToPinecone).mockResolvedValue({
      success: false,
      error: 'Database connection failed',
    });

    render(<IngestPage />);

    await waitFor(() => expect(screen.getByText('Model Ready')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Paste your document/), {
      target: { value: 'Test text' },
    });
    fireEvent.click(screen.getByText('Process & Ingest'));

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });
});
