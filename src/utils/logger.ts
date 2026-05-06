type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getLogLevel = (): LogLevel => {
  if (process.env.NEXT_PUBLIC_LOG_LEVEL) {
    return process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const currentLogLevel = getLogLevel();

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
};

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

/**
 * A dedicated logger for the application that supports different log levels and metadata.
 */
export const logger = {
  debug: (message: string, ...meta: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message), ...meta);
    }
  },
  info: (message: string, ...meta: unknown[]) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message), ...meta);
    }
  },
  warn: (message: string, ...meta: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...meta);
    }
  },
  error: (message: string, ...meta: unknown[]) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...meta);
    }
  },
};

export type { LogLevel };
