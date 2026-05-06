import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelStatus } from './ModelStatus';

describe('ModelStatus', () => {
  it('should render nothing when isReady is true', () => {
    const { container } = render(
      <ModelStatus isReady={true} progress={{ file: 'test.bin', progress: 50 }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when progress is null', () => {
    const { container } = render(<ModelStatus isReady={false} progress={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render progress when loading', () => {
    render(<ModelStatus isReady={false} progress={{ file: 'model.bin', progress: 45.6 }} />);

    expect(screen.getByText('Downloading local model...')).toBeInTheDocument();
    expect(screen.getByText(/model.bin/)).toBeInTheDocument();
    expect(screen.getByText(/46%/)).toBeInTheDocument(); // Math.round(45.6)
  });
});
