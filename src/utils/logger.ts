/**
 * Secure Logging Utility
 * Only logs in development and never exposes sensitive data
 */

import { canLog, sanitizeForLogging, SECURITY_CONFIG } from '@/config/security';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class SecureLogger {
  private log(level: LogLevel, message: string, data?: any) {
    if (!canLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      data: sanitizeForLogging(data),
      timestamp: new Date().toISOString()
    };

    const consoleMethod = level === 'debug' ? 'log' :
                         level === 'info' ? 'info' :
                         level === 'warn' ? 'warn' : 'error';

    console[consoleMethod](`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, logEntry.data || '');
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  // API-specific logging methods
  apiRequest(endpoint: string, method: string = 'GET') {
    this.debug(`API Request: ${method} ${endpoint}`);
  }

  apiResponse(endpoint: string, success: boolean, statusCode?: number) {
    this.debug(`API Response: ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'} (${statusCode || 'unknown'})`);
  }

  userAction(action: string, details?: any) {
    this.info(`User Action: ${action}`, details);
  }
}

export const logger = new SecureLogger();

// Export convenience functions
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logApiRequest = logger.apiRequest.bind(logger);
export const logApiResponse = logger.apiResponse.bind(logger);
export const logUserAction = logger.userAction.bind(logger);