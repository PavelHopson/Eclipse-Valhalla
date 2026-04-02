/**
 * Eclipse Valhalla — Log Service
 *
 * Structured logging with levels.
 * Dev: console output. Production: ready for external service.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let _minLevel: LogLevel = import.meta.env.PROD ? 'info' : 'debug';

export function setLogLevel(level: LogLevel): void {
  _minLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[_minLevel];
}

function format(level: LogLevel, module: string, message: string, data?: any): string {
  const ts = new Date().toISOString().slice(11, 23);
  return `[${ts}] [${level.toUpperCase()}] [${module}] ${message}`;
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: any) => {
      if (shouldLog('debug')) console.debug(format('debug', module, msg), data ?? '');
    },
    info: (msg: string, data?: any) => {
      if (shouldLog('info')) console.info(format('info', module, msg), data ?? '');
    },
    warn: (msg: string, data?: any) => {
      if (shouldLog('warn')) console.warn(format('warn', module, msg), data ?? '');
    },
    error: (msg: string, data?: any) => {
      if (shouldLog('error')) console.error(format('error', module, msg), data ?? '');
      // TODO: Send to error tracking service (Sentry, etc.)
    },
  };
}
