/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useWebLLM } from './useWebLLM';
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(),
}));

describe('useWebLLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWebLLM());
    expect(result.current.status).toBe('uninitialized');
    expect(result.current.isReady).toBe(false);
    expect(result.current.progress).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle successful initialization', async () => {
    const mockEngine = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    };
    (CreateMLCEngine as any).mockResolvedValue(mockEngine);

    const { result } = renderHook(() => useWebLLM());

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.isReady).toBe(true);
    expect(CreateMLCEngine).toHaveBeenCalled();
  });

  it('should handle initialization progress', async () => {
    let progressCallback: any;
    (CreateMLCEngine as any).mockImplementation((_model: any, options: any) => {
      progressCallback = options.initProgressCallback;
      // We don't resolve yet to simulate progress
      return new Promise((resolve) => {
        setTimeout(() => {
          if (progressCallback) {
            progressCallback({ progress: 0.5, text: 'Downloading...' });
          }
          resolve({
            chat: { completions: { create: vi.fn() } },
          });
        }, 10);
      });
    });

    const { result } = renderHook(() => useWebLLM());

    await act(async () => {
      const initPromise = result.current.initialize();
      await initPromise;
    });

    // In this implementation, progress is set to null when ready
    expect(result.current.status).toBe('ready');
    expect(result.current.progress).toBe(null);
  });

  it('should handle initialization error', async () => {
    (CreateMLCEngine as any).mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useWebLLM());

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Failed to load');
  });

  it('should stream chat completions', async () => {
    const mockChunks = [
      { choices: [{ delta: { content: 'Hello' } }] },
      { choices: [{ delta: { content: ' world' } }] },
    ];

    const mockEngine = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue(
            (async function* () {
              for (const chunk of mockChunks) {
                yield chunk;
              }
            })()
          ),
        },
      },
    };
    (CreateMLCEngine as any).mockResolvedValue(mockEngine);

    const { result } = renderHook(() => useWebLLM());

    await act(async () => {
      await result.current.initialize();
    });

    const messages = [{ role: 'user', content: 'Hi' }];
    const chunks: string[] = [];

    await act(async () => {
      const generator = result.current.chat(messages as any);
      for await (const chunk of generator) {
        chunks.push(chunk);
      }
    });

    expect(chunks).toEqual(['Hello', ' world']);
  });

  it('should throw error if chat is called before initialization', async () => {
    const { result } = renderHook(() => useWebLLM());
    const messages = [{ role: 'user', content: 'Hi' }];

    try {
      const generator = result.current.chat(messages as any);
      await act(async () => {
        await generator.next();
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toBe('WebLLM engine not ready. Please initialize it first.');
    }
  });
});
