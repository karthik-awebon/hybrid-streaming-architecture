/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocalChat } from './LocalChat';
import { useEmbedding } from '@/hooks/useEmbedding';
import { useWebLLM } from '@/hooks/useWebLLM';
import { oramaDB } from '@/lib/orama-db';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useEmbedding');
vi.mock('@/hooks/useWebLLM');
vi.mock('@/lib/orama-db', () => ({
  oramaDB: {
    search: vi.fn(),
  },
}));

describe('LocalChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      generateEmbedding: vi.fn(),
    } as any);
    vi.mocked(useWebLLM).mockReturnValue({
      isReady: true,
      status: 'ready',
      progress: null,
      initialize: vi.fn(),
      chat: vi.fn(),
    } as any);

    render(<LocalChat />);
    expect(screen.getByText('Fully Local Chat (RAG)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/How can I help you today/i)).toBeInTheDocument();
  });

  it('handles chat submission', async () => {
    const generateEmbedding = vi.fn().mockResolvedValue([0.1]);
    const mockStreamChat = async function* () {
      yield 'Hello ';
      yield 'world!';
    };

    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      generateEmbedding,
    } as any);
    vi.mocked(useWebLLM).mockReturnValue({
      isReady: true,
      status: 'ready',
      progress: null,
      initialize: vi.fn(),
      chat: mockStreamChat,
    } as any);
    vi.mocked(oramaDB.search).mockResolvedValue([
      { id: '1', text: 'Context document', score: 1 },
    ] as any);

    render(<LocalChat />);

    const input = screen.getByPlaceholderText(/How can I help you today/i);
    fireEvent.change(input, { target: { value: 'What is in the context?' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Hello world!')).toBeInTheDocument();
      expect(oramaDB.search).toHaveBeenCalled();
    });
  });
});
