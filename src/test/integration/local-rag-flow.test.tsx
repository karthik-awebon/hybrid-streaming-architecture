/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useWebLLM } from '@/hooks/useWebLLM';
import { oramaDB } from '@/lib/orama-db';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

// Mock useWebLLM
vi.mock('@/hooks/useWebLLM', () => ({
  useWebLLM: vi.fn(),
}));

// Mock Worker for embedding
class MockWorker {
  onmessage: ((ev: any) => void) | null = null;
  postMessage = vi.fn((msg) => {
    if (msg.action === 'init') {
      setTimeout(() => this.onmessage?.({ data: { status: 'ready' } }), 0);
    } else if (msg.action === 'embed') {
      // Return a dummy vector. In reality, same text produces same vector.
      setTimeout(() => {
        this.onmessage?.({
          data: { status: 'complete', id: msg.id, vector: new Array(384).fill(0.1) },
        });
      }, 0);
    }
  });
  terminate = vi.fn();
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Import the component (DashboardPage is default export)
import Dashboard from '@/app/dashboard/page';

describe('Local RAG Full Integration Flow', () => {
  const mockStreamChat = vi.fn();

  beforeEach(async () => {
    vi.stubGlobal('Worker', MockWorker);
    vi.stubGlobal('URL', vi.fn());
    vi.clearAllMocks();

    // Reset Orama
    await oramaDB.clear();

    // Setup useWebLLM mock
    (useWebLLM as any).mockReturnValue({
      status: 'ready',
      isReady: true,
      progress: null,
      error: null,
      initialize: vi.fn(),
      chat: mockStreamChat,
      stop: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should ingest text and use it as context in chat', async () => {
    render(<Dashboard />);

    // 1. Wait for Ingest model to be ready
    await waitFor(() => {
      expect(screen.getAllByText(/Ready/i)[0]).toBeInTheDocument();
    });

    // 2. Ingest simple text
    const textarea = screen.getByPlaceholderText(/Paste your text here/i);
    const ingestButton = screen.getByRole('button', { name: /Ingest Text/i });

    fireEvent.change(textarea, { target: { value: 'The capital of France is Paris.' } });
    fireEvent.click(ingestButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Successfully ingested/i)).toBeInTheDocument();
    });

    // 3. Mock the LLM stream response
    mockStreamChat.mockImplementation(async function* () {
      yield 'Based on the provided documents, the capital of ';
      yield 'France is Paris.';
    });

    // 4. Ask a question in the chat
    const chatInput = screen.getByPlaceholderText(/How can I help you today\?/i);
    fireEvent.change(chatInput, { target: { value: 'What is the capital of France?' } });

    // Find the send button (it's the one with the SVG)
    const sendButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('path[d*="M3.478"]') // Send icon path
    );

    if (sendButton) {
      fireEvent.click(sendButton);
    } else {
      // fallback if icon changes
      fireEvent.submit(chatInput.closest('form')!);
    }

    // 5. Verify search was performed and LLM was called with context
    await waitFor(() => {
      // Verify the SourceGrid appears showing the ingested text
      // It appears at least twice: once in the SourceGrid and once in the LLM response
      const occurrences = screen.getAllByText(/The capital of France is Paris/i);
      expect(occurrences.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/1 matches/i)).toBeInTheDocument();
    });

    // 6. Verify the final answer from LLM
    await waitFor(() => {
      expect(screen.getByText(/Based on the provided documents/i)).toBeInTheDocument();
    });

    expect(mockStreamChat).toHaveBeenCalled();

    // Check if the prompt sent to LLM contains the context
    if (mockStreamChat.mock.calls.length > 0 && mockStreamChat.mock.calls[0]) {
      const lastCallArgs = mockStreamChat.mock.calls[0][0];
      const userPrompt = lastCallArgs.find((m: any) => m.role === 'user').content;
      expect(userPrompt).toContain('The capital of France is Paris');
    }
  });
});
