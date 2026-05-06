/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatPage from './page';
import { useChatLogic } from '@/hooks/useChatLogic';

vi.mock('@/hooks/useChatLogic', () => ({
  useChatLogic: vi.fn(),
}));

vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/MessageList', () => ({
  MessageList: () => <div data-testid="message-list">MessageList</div>,
}));

vi.mock('@/components/ChatInput', () => ({
  ChatInput: () => <div data-testid="chat-input">ChatInput</div>,
}));

vi.mock('@/components/ModelStatus', () => ({
  ModelStatus: () => <div data-testid="model-status">ModelStatus</div>,
}));

vi.mock('@/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) =>
    message ? <div data-testid="error-message">{message}</div> : null,
}));

describe('ChatPage', () => {
  beforeEach(() => {
    vi.mocked(useChatLogic).mockReturnValue({
      input: '',
      setInput: vi.fn(),
      messages: [],
      isLoading: false,
      isReady: true,
      progress: null,
      handleSubmit: vi.fn(),
      latency: null,
      error: undefined,
      status: 'idle',
    });
  });

  it('should render all components', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('should show latency when available', () => {
    vi.mocked(useChatLogic).mockReturnValue({
      ...vi.mocked(useChatLogic)(),
      latency: 123.456,
    } as any);

    render(<ChatPage />);
    expect(screen.getByText(/TTFT \(Total\): 123ms/)).toBeInTheDocument();
  });

  it('should show error message when error exists', () => {
    vi.mocked(useChatLogic).mockReturnValue({
      ...vi.mocked(useChatLogic)(),
      error: new Error('Chat failed') as any,
    });

    render(<ChatPage />);
    expect(screen.getByTestId('error-message')).toHaveTextContent('Chat failed');
  });
});
