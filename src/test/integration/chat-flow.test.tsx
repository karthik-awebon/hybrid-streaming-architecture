/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '@/app/hybrid-rag/page';
import { useChat } from '@ai-sdk/react';

// Mock useChat from AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

// Mock Worker
class MockWorker {
  onmessage: ((ev: any) => void) | null = null;
  postMessage = vi.fn((msg) => {
    if (msg.action === 'init') {
      setTimeout(() => this.onmessage?.({ data: { status: 'ready' } }), 0);
    } else if (msg.action === 'embed') {
      setTimeout(() => {
        this.onmessage?.({
          data: { status: 'complete', id: msg.id, vector: [0.1, 0.1, 0.1] },
        });
      }, 0);
    }
  });
  terminate = vi.fn();
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/hybrid-rag'),
}));

describe('Chat Flow Integration', () => {
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('Worker', MockWorker);
    vi.stubGlobal('URL', vi.fn());
    vi.clearAllMocks();

    vi.mocked(useChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      status: 'idle',
      error: undefined,
      input: '',
      setInput: vi.fn(),
      handleSubmit: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should complete the full chat flow from input to message submission', async () => {
    const { rerender } = render(<ChatPage />);

    // 1. Wait for model ready
    await waitFor(() => {
      expect(screen.getByText('Model Ready')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('How can I help you today?');
    const button = screen.getByRole('button');

    // 2. Type and Submit
    fireEvent.change(input, { target: { value: 'Explain hybrid RAG' } });
    fireEvent.click(button);

    // 3. Verify embedding was generated and sendMessage called
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          parts: [{ type: 'text', text: 'Explain hybrid RAG' }],
        }),
        expect.objectContaining({
          body: { data: { embedding: [0.1, 0.1, 0.1] } },
        })
      );
    });

    // 4. Simulate response arrival by updating useChat mock and rerendering
    vi.mocked(useChat).mockReturnValue({
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Explain hybrid RAG',
          parts: [{ type: 'text', text: 'Explain hybrid RAG' }],
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hybrid RAG combines...',
          parts: [{ type: 'text', text: 'Hybrid RAG combines...' }],
        },
      ],
      sendMessage: mockSendMessage,
      status: 'idle',
      error: undefined,
    } as any);

    rerender(<ChatPage />);

    expect(screen.getByText('Explain hybrid RAG')).toBeInTheDocument();
    expect(screen.getByText('Hybrid RAG combines...')).toBeInTheDocument();
  });

  it('should show loading state while waiting for response', async () => {
    render(<ChatPage />);

    await waitFor(() => expect(screen.getByText('Model Ready')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('How can I help you today?'), {
      target: { value: 'Help' },
    });
    fireEvent.click(screen.getByRole('button'));

    // Update mock to show streaming status
    vi.mocked(useChat).mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Help', parts: [{ type: 'text', text: 'Help' }] },
      ],
      sendMessage: mockSendMessage,
      status: 'streaming',
      error: undefined,
    } as any);

    render(<ChatPage />); // Note: in real use, state update triggers re-render

    // MessageList shows loading indicator (the bounce dots)
    const bounceDots = document.querySelector('.animate-bounce');
    expect(bounceDots).toBeInTheDocument();
  });
});
