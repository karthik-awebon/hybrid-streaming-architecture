/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocalIngest } from './LocalIngest';
import { useEmbedding } from '@/hooks/useEmbedding';
import { oramaDB } from '@/lib/orama-db';

// Mock dependencies
vi.mock('@/hooks/useEmbedding', () => ({
  useEmbedding: vi.fn(),
}));

vi.mock('@/lib/orama-db', () => ({
  oramaDB: {
    insert: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('@/utils/document-parser', () => ({
  parseDocument: vi.fn(),
}));

describe('LocalIngest - Clear Functionality', () => {
  const mockGenerateEmbedding = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEmbedding as any).mockReturnValue({
      isReady: true,
      progress: null,
      generateEmbedding: mockGenerateEmbedding,
    });
  });

  it('should show confirmation buttons when clear button is clicked', async () => {
    render(<LocalIngest />);

    const clearButton = screen.getByTitle('Clear local index');
    fireEvent.click(clearButton);

    expect(screen.getByText(/Are you sure\?/i)).toBeDefined();
    expect(screen.getByText('Yes, Clear')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('should call oramaDB.clear when "Yes, Clear" is clicked', async () => {
    vi.mocked(oramaDB.clear).mockResolvedValue(undefined);

    render(<LocalIngest />);

    fireEvent.click(screen.getByTitle('Clear local index'));
    fireEvent.click(screen.getByText('Yes, Clear'));

    await waitFor(() => {
      expect(oramaDB.clear).toHaveBeenCalled();
      expect(screen.getByText('Local index cleared successfully')).toBeDefined();
    });
  });

  it('should hide confirmation and not call clear when "Cancel" is clicked', async () => {
    render(<LocalIngest />);

    fireEvent.click(screen.getByTitle('Clear local index'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText(/Are you sure\?/i)).toBeNull();
    expect(oramaDB.clear).not.toHaveBeenCalled();
  });
});
