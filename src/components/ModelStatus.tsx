interface ModelStatusProps {
  isReady: boolean;
  progress: { file: string; progress: number } | null;
}

export function ModelStatus({ isReady, progress }: ModelStatusProps) {
  if (isReady || !progress) return null;

  return (
    <div className="mx-auto max-w-sm p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 text-center">
      <p className="text-sm font-medium text-blue-700 mb-2">Downloading local model...</p>
      <div className="w-full bg-blue-100 rounded-full h-1.5 mb-2">
        <div 
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      <p className="text-[10px] text-blue-500 uppercase tracking-wider font-semibold">
        {progress.file} • {Math.round(progress.progress)}%
      </p>
    </div>
  );
}
