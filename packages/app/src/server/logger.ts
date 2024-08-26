import pino from "pino";
import type { Logger } from "pino";
import type { RollupError } from "rollup";
import type {
  LogErrorOptions,
  LogOptions,
  LogType,
  Logger as ViteLogger,
} from "vite";

export class ViteLoggerAdapter implements ViteLogger {
  private _loggedErrors = new WeakSet<Error | RollupError>();
  private _warnedMessages = new Set<string>();
  private _hasWarned = false;
  private _logger: Logger;

  constructor(logger: Logger) {
    this._logger = logger.child({}, { msgPrefix: "[vite] " });
  }

  get hasWarned(): boolean {
    return this._hasWarned;
  }

  info(message: string, options?: LogOptions): void {
    this.output("info", message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this._hasWarned = true;
    this.output("warn", message, options);
  }

  warnOnce(message: string, options?: LogOptions): void {
    if (this._warnedMessages.has(message)) return;
    this._hasWarned = true;
    this.output("warn", message, options);
    this._warnedMessages.add(message);
  }

  error(message: string, options?: LogErrorOptions): void {
    this._hasWarned = true;
    this.output("error", message, options);
  }

  clearScreen(): void {
    /* noop */
  }

  hasErrorLogged(error: Error | RollupError): boolean {
    return this._loggedErrors.has(error);
  }

  private output(
    type: LogType,
    message: string,
    options: LogErrorOptions = {},
  ) {
    if (options.error) {
      this._loggedErrors.add(options.error);
    }

    this._logger[type](message);
  }
}

export function createLogger() {
  return pino();
}
