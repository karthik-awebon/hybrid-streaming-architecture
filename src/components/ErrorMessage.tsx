interface ErrorMessageProps {
  message: string | null;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl ${className}`}
      role="alert"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
}
