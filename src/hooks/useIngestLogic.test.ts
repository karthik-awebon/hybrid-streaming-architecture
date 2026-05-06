import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIngestLogic } from './useIngestLogic';
import { useEmbedding } from '@/hooks/useEmbedding';
import { chunkText } from '@/utils/chunking';
import { upsertToPinecone } from '@/actions/ingest';

vi.mock('@/hooks/useEmbedding', () => ({
  useEmbedding: vi.fn(),
}));

vi.mock('@/utils/chunking', () => ({
  chunkText: vi.fn(),
}));

vi.mock('@/actions/ingest', () => ({
  upsertToPinecone: vi.fn(),
}));

describe('useIngestLogic', () => {
  const mockGenerateEmbedding = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEmbedding).mockReturnValue({
      isReady: true,
      progress: null,
      generateEmbedding: mockGenerateEmbedding,
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useIngestLogic());
    expect(result.current.text).toBe('');
    expect(result.current.status).toBe('idle');
  });

  it('should handle ingestion successfully', async () => {
    const { result } = renderHook(() => useIngestLogic());

    vi.mocked(chunkText).mockReturnValue(['chunk 1', 'chunk 2']);
    mockGenerateEmbedding.mockResolvedValue([0.1, 0.2]);
    vi.mocked(upsertToPinecone).mockResolvedValue({ success: true, count: 2 });

    act(() => {
      result.current.setText('Some long text that needs ingestion');
    });

    await act(async () => {
      await result.current.handleIngest();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.message).toContain('Successfully inserted 2 vectors');
    expect(result.current.text).toBe('');
    expect(upsertToPinecone).toHaveBeenCalledWith([
      { text: 'chunk 1', embedding: [0.1, 0.2] },
      { text: 'chunk 2', embedding: [0.1, 0.2] },
    ]);
  });

  it('should handle validation error', async () => {
    const { result } = renderHook(() => useIngestLogic());

    act(() => {
      result.current.setText(''); // Empty text
    });

    await act(async () => {
      await result.current.handleIngest();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('Text is required for ingestion');
  });

  it('should handle embedding failure', async () => {
    const { result } = renderHook(() => useIngestLogic());

    vi.mocked(chunkText).mockReturnValue(['chunk 1']);
    mockGenerateEmbedding.mockRejectedValue(new Error('Local error'));

    act(() => {
      result.current.setText('valid text');
    });

    await act(async () => {
      await result.current.handleIngest();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('Failed to generate embeddings.');
  });

  it('should handle pinecone upload failure', async () => {
    const { result } = renderHook(() => useIngestLogic());

    vi.mocked(chunkText).mockReturnValue(['chunk 1']);
    mockGenerateEmbedding.mockResolvedValue([0.1]);
    vi.mocked(upsertToPinecone).mockResolvedValue({ success: false, error: 'Pinecone error' });

    act(() => {
      result.current.setText('valid text');
    });

    await act(async () => {
      await result.current.handleIngest();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('Pinecone error');
  });
});
