import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IngestPage from './page';
import { useIngestLogic } from '@/hooks/useIngestLogic';

vi.mock('@/hooks/useIngestLogic', () => ({
  useIngestLogic: vi.fn(),
}));

vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/ModelStatus', () => ({
  ModelStatus: () => <div data-testid="model-status">ModelStatus</div>,
}));

vi.mock('@/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) =>
    message ? <div data-testid="error-message">{message}</div> : null,
}));

describe('IngestPage', () => {
  const mockHandleIngest = vi.fn();
  const mockSetText = vi.fn();

  beforeEach(() => {
    vi.mocked(useIngestLogic).mockReturnValue({
      text: '',
      setText: mockSetText,
      status: 'idle',
      message: '',
      isReady: true,
      progress: null,
      handleIngest: mockHandleIngest,
    });
  });

  it('should render correctly', () => {
    render(<IngestPage />);
    expect(screen.getByText('Ingest Data to Pinecone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste your document/)).toBeInTheDocument();
  });

  it('should call setText on change', () => {
    render(<IngestPage />);
    const textarea = screen.getByPlaceholderText(/Paste your document/);
    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(mockSetText).toHaveBeenCalledWith('New text');
  });

  it('should call handleIngest on button click', () => {
    vi.mocked(useIngestLogic).mockReturnValue({
      ...vi.mocked(useIngestLogic)(),
      text: 'some text',
    });

    render(<IngestPage />);
    const button = screen.getByText('Process & Ingest');
    fireEvent.click(button);
    expect(mockHandleIngest).toHaveBeenCalled();
  });

  it('should show success message', () => {
    vi.mocked(useIngestLogic).mockReturnValue({
      ...vi.mocked(useIngestLogic)(),
      status: 'success',
      message: 'Success!',
    });

    render(<IngestPage />);
    expect(screen.getByText('Success!')).toHaveClass('text-emerald-600');
  });

  it('should disable button while processing', () => {
    vi.mocked(useIngestLogic).mockReturnValue({
      ...vi.mocked(useIngestLogic)(),
      status: 'embedding',
    });

    render(<IngestPage />);
    const button = screen.getByText('Processing...');
    expect(button).toBeDisabled();
  });
});
