import { SourceGridProps } from '@/types/components';

/**
 * SourceGrid component displays the search results from the vector database.
 * Shows relevant text chunks and their associated metadata (like source filename).
 */
export function SourceGrid({ sources, title = 'Relevant Sources' }: SourceGridProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-mono">
          {sources.length} matches
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map((source, idx) => (
          <div
            key={source.id}
            className="group p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-md hover:shadow-purple-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                SOURCE {idx + 1}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Score: {source.score.toFixed(4)}
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{source.text}</p>

            {typeof source.metadata?.source === 'string' && (
              <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-3 h-3 text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <span className="text-[10px] font-medium text-slate-500 truncate">
                  {source.metadata.source}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
