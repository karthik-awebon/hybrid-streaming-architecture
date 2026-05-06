/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmbedding } from './useEmbedding';
let lastWorkerInstance: MockWorker | null = null;

class MockWorker {
  onmessage: ((ev: any) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    lastWorkerInstance = this;
  }
}

describe('useEmbedding', () => {
  beforeEach(() => {
    lastWorkerInstance = null;
    vi.stubGlobal('Worker', MockWorker);
    vi.stubGlobal('URL', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize worker on mount and handle ready state', () => {
    const { result } = renderHook(() => useEmbedding());

    expect(lastWorkerInstance).not.toBeNull();
    expect(result.current.isReady).toBe(false);

    act(() => {
      lastWorkerInstance?.onmessage?.({ data: { status: 'ready' } });
    });

    expect(result.current.isReady).toBe(true);
  });

  it('should update progress', () => {
    const { result } = renderHook(() => useEmbedding());

    act(() => {
      lastWorkerInstance?.onmessage?.({
        data: { status: 'progress', file: 'model.bin', progress: 50 },
      });
    });

    expect(result.current.progress).toEqual({ file: 'model.bin', progress: 50 });
  });

  it('should resolve generateEmbedding when worker completes', async () => {
    const { result } = renderHook(() => useEmbedding());
    const mockVector = [0.1, 0.2, 0.3];

    let embeddingPromise: Promise<number[]>;
    act(() => {
      embeddingPromise = result.current.generateEmbedding('test text');
    });

    // Capture the random ID from postMessage
    const lastCall = lastWorkerInstance?.postMessage.mock.calls[1]; // 0 is 'init'
    const id = lastCall?.[0]?.id;

    act(() => {
      lastWorkerInstance?.onmessage?.({
        data: { status: 'complete', id, vector: mockVector },
      });
    });

    const vector = await embeddingPromise!;
    expect(vector).toEqual(mockVector);
  });

  it('should reject generateEmbedding when worker errors', async () => {
    const { result } = renderHook(() => useEmbedding());

    let embeddingPromise: Promise<number[]>;
    act(() => {
      embeddingPromise = result.current.generateEmbedding('test text');
    });

    const calls = lastWorkerInstance?.postMessage.mock.calls;
    const id = calls && calls[1] ? calls[1][0].id : null;

    act(() => {
      lastWorkerInstance?.onmessage?.({
        data: { status: 'error', id, error: 'Failed to embed' },
      });
    });

    await expect(embeddingPromise!).rejects.toThrow('Failed to embed');
  });
});
