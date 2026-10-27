export type LogContext = Readonly<Record<string, string>>;

export interface Logger {
  error(message: string, context?: LogContext): void;
}
