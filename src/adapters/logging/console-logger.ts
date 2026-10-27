import type { LogContext, Logger } from "@/application/ports/logger";

export class ConsoleLogger implements Logger {
  error(message: string, context?: LogContext): void {
    console.error(message, context ?? {});
  }
}
