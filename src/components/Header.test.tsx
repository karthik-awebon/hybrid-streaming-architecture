/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { usePathname } from 'next/navigation';

describe('Header', () => {
  it('should render title and links', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<Header isReady={true} />);

    // Check title (h1)
    const title = screen.getByRole('heading', { level: 1, name: /Hybrid Streaming Architecture/i });
    expect(title).toBeInTheDocument();

    // Check navigation links
    expect(screen.getByText('Home')).toBeInTheDocument();
    // Use getAllByText for 'Hybrid RAG' since it appears in h1 and as a link
    const hybridRagLinks = screen.getAllByText('Hybrid RAG');
    expect(hybridRagLinks.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Local RAG')).toBeInTheDocument();
    expect(screen.getByText('Server RAG')).toBeInTheDocument();
    expect(screen.getByText('Ingest')).toBeInTheDocument();
  });

  it('should highlight active link', () => {
    vi.mocked(usePathname).mockReturnValue('/ingest');
    render(<Header isReady={true} />);

    expect(screen.getByText('Ingest')).toHaveClass('text-blue-600');
    // 'Home' should not be highlighted
    expect(screen.getByText('Home')).toHaveClass('text-slate-500');
  });

  it('should show "Model Ready" status when isReady is true', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<Header isReady={true} />);

    expect(screen.getByText('Model Ready')).toBeInTheDocument();
    expect(screen.queryByText('Loading Model...')).not.toBeInTheDocument();
  });

  it('should show "Loading Model..." status when isReady is false', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<Header isReady={false} />);

    expect(screen.getByText('Loading Model...')).toBeInTheDocument();
  });
});
