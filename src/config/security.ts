/**
 * Security Configuration
 * Controls logging and security features based on environment
 */

export const SECURITY_CONFIG = {
  // Environment detection (use import.meta.env for Vite compatibility)
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',

  // Debug settings
  enableDebugLogging: import.meta.env.REACT_APP_DEBUG === 'true',
  enableConsoleLogging: import.meta.env.REACT_APP_ENABLE_CONSOLE_LOGGING === 'true',

  // Security features
  sanitizeLogs: true,
  disableConsoleInProduction: true,

  // Sensitive data patterns to mask in logs
  sensitivePatterns: [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /bearer/i,
    /authorization/i,
    /api_key/i,
    /access_token/i,
    /refresh_token/i,
    /phone/i,
    /email/i,
    /credit/i,
    /balance/i,
    /card/i,
    /ssn/i,
    /social/i,
    /url/i,  // Don't log full URLs with API endpoints
    /endpoint/i,  // Don't log API endpoints
    /profile/i,  // User profile endpoints
    /user/i,  // User-specific data
    /account/i  // Account information
  ]
};

/**
 * Check if logging is allowed for the current environment
 */
export const canLog = (level: 'debug' | 'info' | 'warn' | 'error' = 'info'): boolean => {
  if (SECURITY_CONFIG.isProduction && !SECURITY_CONFIG.enableConsoleLogging) {
    return false;
  }

  if (level === 'debug' && !SECURITY_CONFIG.enableDebugLogging) {
    return false;
  }

  return SECURITY_CONFIG.isDevelopment || SECURITY_CONFIG.enableConsoleLogging;
};

/**
 * Sanitize sensitive data from objects before logging
 */
export const sanitizeForLogging = (data: any): any => {
  if (!data || !SECURITY_CONFIG.sanitizeLogs) return data;

  if (typeof data === 'string') {
    let sanitized = data;
    SECURITY_CONFIG.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '***');
    });
    return sanitized;
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (SECURITY_CONFIG.sensitivePatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return data;
};
