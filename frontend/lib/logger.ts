type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  child: (scope: string) => Logger;
};

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const normalizeLevel = (value?: string): LogLevel | null => {
  if (!value) return null;
  const level = value.toLowerCase();
  return level in LEVELS ? (level as LogLevel) : null;
};

const DEFAULT_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

const resolvedLevel: LogLevel =
  normalizeLevel(process.env.NEXT_PUBLIC_LOG_LEVEL) ??
  normalizeLevel(process.env.LOG_LEVEL) ??
  DEFAULT_LEVEL;

const isServer = () => typeof window === "undefined";

const shouldLog = (level: LogLevel) => LEVELS[level] >= LEVELS[resolvedLevel];

const emit = (
  level: LogLevel,
  scope: string | undefined,
  message: string,
  context?: LogContext,
) => {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const side = isServer() ? "server" : "client";
  const scopeLabel = scope ? ` [${scope}]` : "";
  const prefix = `${timestamp} ${level.toUpperCase()}${scopeLabel} (${side})`;
  const loggerFn = console[level] ?? console.log;

  if (context && Object.keys(context).length > 0) {
    loggerFn(prefix, message, context);
  } else {
    loggerFn(prefix, message);
  }
};

export const createLogger = (scope?: string): Logger => ({
  debug: (message, context) => emit("debug", scope, message, context),
  info: (message, context) => emit("info", scope, message, context),
  warn: (message, context) => emit("warn", scope, message, context),
  error: (message, context) => emit("error", scope, message, context),
  child: (childScope) =>
    createLogger(scope ? `${scope}:${childScope}` : childScope),
});

export const logger = createLogger();

export type { LogContext, LogLevel, Logger };
