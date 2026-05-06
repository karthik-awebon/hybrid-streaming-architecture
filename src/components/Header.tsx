import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeaderProps } from '@/types/components';

/**
 * Application header component containing navigation and model status indicator.
 */
export function Header({ isReady }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">Hybrid RAG</h1>
        </div>

        <nav className="flex gap-4 ml-4">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Chat
          </Link>
          <Link
            href="/ingest"
            className={`text-sm font-medium transition-colors ${pathname === '/ingest' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Ingest
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'}`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
          {isReady ? 'Model Ready' : 'Loading Model...'}
        </div>
      </div>
    </header>
  );
}
