/**
 * Structured logging utility for the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  requestId?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private requestId?: string;
  private baseContext: LogContext = {};

  constructor(private minLevel: LogLevel = LogLevel.INFO) {
    // Set from environment if available
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (envLevel && Object.values(LogLevel).includes(envLevel)) {
      this.minLevel = envLevel;
    }
  }

  setRequestId(id: string) {
    this.requestId = id;
  }

  setContext(context: LogContext) {
    this.baseContext = { ...this.baseContext, ...context };
  }

  clearContext() {
    this.baseContext = {};
    this.requestId = undefined;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context || Object.keys(this.baseContext).length > 0) {
      entry.context = { ...this.baseContext, ...context };
    }

    if (this.requestId) {
      entry.requestId = this.requestId;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: (error as { code?: string }).code,
      };
    }

    return entry;
  }

  private write(entry: LogEntry) {
    const output = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.write(this.formatLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.write(this.formatLogEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.write(this.formatLogEntry(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.write(this.formatLogEntry(LogLevel.ERROR, message, context, error));
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.minLevel);
    childLogger.setContext({ ...this.baseContext, ...context });
    if (this.requestId) {
      childLogger.setRequestId(this.requestId);
    }
    return childLogger;
  }

  /**
   * Time a function execution and log the duration
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${operation} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${operation} failed`, error as Error, { ...context, duration });
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for creating loggers with context
export function createLogger(context?: LogContext): Logger {
  const log = new Logger();
  if (context) {
    log.setContext(context);
  }
  return log;
}

// Export type for consumers
export type LoggerInstance = Logger;
