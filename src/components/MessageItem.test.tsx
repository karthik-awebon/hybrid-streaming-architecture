/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from './MessageItem';
import { UIMessage } from 'ai';

describe('MessageItem', () => {
  it('should render user message correctly', () => {
    const message: UIMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      parts: [{ type: 'text', text: 'Hello' }],
    } as any;
    render(<MessageItem message={message} />);

    const messageContent = screen.getByText('Hello');
    const bubble = messageContent.closest('.max-w-\\[85\\%\\]');
    expect(bubble).toHaveClass('bg-blue-600');
    expect(bubble).toHaveClass('text-white');
  });

  it('should render assistant message correctly', () => {
    const message: UIMessage = {
      id: '2',
      role: 'assistant',
      content: 'Hi',
      parts: [{ type: 'text', text: 'Hi' }],
    } as any;
    render(<MessageItem message={message} />);

    const messageContent = screen.getByText('Hi');
    const bubble = messageContent.closest('.max-w-\\[85\\%\\]');
    expect(bubble).toHaveClass('bg-slate-50');
    expect(bubble).toHaveClass('text-slate-800');
  });

  it('should filter only text parts', () => {
    const message: UIMessage = {
      id: '3',
      role: 'assistant',
      content: '',
      parts: [
        { type: 'text', text: 'Some text' },
        { type: 'image', url: 'foo' },
        { type: 'text', text: ' more text' },
      ],
    } as any;
    render(<MessageItem message={message} />);

    expect(screen.getByText('Some text more text')).toBeInTheDocument();
  });
});
