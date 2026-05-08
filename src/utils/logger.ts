/**
 * Log levels supported by the application.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Priority mapping for log levels to determine if a message should be logged.
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Determines the current log level from environment variables or defaults.
 * @returns The active LogLevel.
 */
const getLogLevel = (): LogLevel => {
  if (process.env.NEXT_PUBLIC_LOG_LEVEL) {
    return process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const currentLogLevel = getLogLevel();

/**
 * Checks if a given log level should be logged based on the current configuration.
 * @param level - The level to check.
 * @returns True if the message should be logged.
 */
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
};

/**
 * Formats a log message with a timestamp and level.
 * @param level - The log level.
 * @param message - The message to format.
 * @returns A formatted log string.
 */
const formatMessage = (level: LogLevel, message: string): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTimestamp = new Date(now.getTime() - offset).toISOString().slice(0, -1);
  return `[${localTimestamp}] [${level.toUpperCase()}] ${message}`;
};

/**
 * A dedicated logger for the application that supports different log levels and metadata.
 */
export const logger = {
  /** Logs a debug message. */
  debug: (message: string, ...meta: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message), ...meta);
    }
  },
  /** Logs an informational message. */
  info: (message: string, ...meta: unknown[]) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message), ...meta);
    }
  },
  /** Logs a warning message. */
  warn: (message: string, ...meta: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...meta);
    }
  },
  /** Logs an error message. */
  error: (message: string, ...meta: unknown[]) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...meta);
    }
  },
};

export type { LogLevel };
