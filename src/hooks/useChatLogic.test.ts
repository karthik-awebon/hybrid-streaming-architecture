/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatLogic } from './useChatLogic';
import { useChat } from '@ai-sdk/react';
import { useEmbedding } from '@/hooks/useEmbedding';

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

vi.mock('@/hooks/useEmbedding', () => ({
  useEmbedding: vi.fn(),
}));

describe('useChatLogic', () => {
  const mockSendMessage = vi.fn();
  const mockGenerateEmbedding = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      status: 'idle',
      error: undefined,
      input: '',
      setInput: vi.fn(),
      handleSubmit: vi.fn(),
      append: vi.fn(),
      reload: vi.fn(),
      stop: vi.fn(),
      setMessages: vi.fn(),
    } as any);

    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      progress: null,
      generateEmbedding: mockGenerateEmbedding,
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChatLogic());
    expect(result.current.input).toBe('');
    expect(result.current.isReady).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle submit correctly', async () => {
    const { result } = renderHook(() => useChatLogic());
    const mockVector = [0.1, 0.2];
    mockGenerateEmbedding.mockResolvedValue(mockVector);

    act(() => {
      result.current.setInput('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(mockGenerateEmbedding).toHaveBeenCalledWith('test message');
    expect(mockSendMessage).toHaveBeenCalledWith(
      {
        role: 'user',
        parts: [{ type: 'text', text: 'test message' }],
      },
      {
        body: { data: { embedding: mockVector } },
      }
    );
    expect(result.current.input).toBe('');
  });

  it('should not submit if input is empty', async () => {
    const { result } = renderHook(() => useChatLogic());

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(mockGenerateEmbedding).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should handle embedding error gracefully', async () => {
    const { result } = renderHook(() => useChatLogic());
    mockGenerateEmbedding.mockRejectedValue(new Error('Embedding failed'));

    act(() => {
      result.current.setInput('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    // Should still send message but with empty embedding
    expect(mockSendMessage).toHaveBeenCalledWith(expect.anything(), {
      body: { data: { embedding: [] } },
    });
  });

  it('should expose the stop function from useChat', () => {
    const mockStop = vi.fn();
    vi.mocked(useChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      status: 'idle',
      error: undefined,
      stop: mockStop,
    } as any);

    const { result } = renderHook(() => useChatLogic());

    act(() => {
      result.current.stop();
    });

    expect(mockStop).toHaveBeenCalled();
  });
});
