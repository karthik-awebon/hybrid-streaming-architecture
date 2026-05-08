import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceGrid } from './SourceGrid';
import { OramaSearchResult } from '@/types/local-rag';

describe('SourceGrid', () => {
  const mockSources: OramaSearchResult[] = [
    {
      id: '1',
      text: 'This is the first source text.',
      score: 0.95,
      metadata: { source: 'document1.pdf' },
    },
    {
      id: '2',
      text: 'This is the second source text, which is a bit longer to test line clamping.',
      score: 0.85,
      metadata: { source: 'document2.docx' },
    },
  ];

  it('should render correctly with sources', () => {
    render(<SourceGrid sources={mockSources} />);

    expect(screen.getByText(/RELEVANT SOURCES/i)).toBeDefined();
    expect(screen.getByText(/2 matches/i)).toBeDefined();
    expect(screen.getByText('This is the first source text.')).toBeDefined();
    expect(screen.getByText('document1.pdf')).toBeDefined();
    expect(screen.getByText('document2.docx')).toBeDefined();
  });

  it('should show scores formatted correctly', () => {
    render(<SourceGrid sources={mockSources} />);

    expect(screen.getByText('Score: 0.9500')).toBeDefined();
    expect(screen.getByText('Score: 0.8500')).toBeDefined();
  });

  it('should return null when sources array is empty', () => {
    const { container } = render(<SourceGrid sources={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
