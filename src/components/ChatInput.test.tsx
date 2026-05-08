import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockSetInput = vi.fn();
  const mockOnSubmit = vi.fn((e) => e.preventDefault());

  it('should render correctly when ready', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isReady={true}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('How can I help you today?');
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('should render correctly when not ready', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isReady={false}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Preparing local AI model...');
    expect(input).toBeDisabled();
  });

  it('should call setInput on change', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isReady={true}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('How can I help you today?');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(mockSetInput).toHaveBeenCalledWith('Hello');
  });

  it('should call onSubmit on form submission', () => {
    render(
      <ChatInput
        input="test message"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isReady={true}
        isLoading={false}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should disable button when input is empty', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isReady={true}
        isLoading={false}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render stop button when loading and onStop is provided', () => {
    const mockOnStop = vi.fn();
    render(
      <ChatInput
        input="test"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isReady={true}
        isLoading={true}
        onStop={mockOnStop}
      />
    );

    // Should have a button that isn't the submit button (type="button")
    const stopButton = screen.getByRole('button');
    expect(stopButton).toHaveAttribute('type', 'button');

    fireEvent.click(stopButton);
    expect(mockOnStop).toHaveBeenCalled();
  });
});
