/**
 * Structured logger for PEARD
 * Logs in JSON format for easy parsing by monitoring tools
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL];
}

function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
    env: process.env.NODE_ENV || 'development'
  });
}

export const logger = {
  error: (message, error) => {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, {
        error: error?.message || error,
        stack: error?.stack
      }));
    }
  },

  warn: (message, data) => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, data));
    }
  },

  info: (message, data) => {
    if (shouldLog('info')) {
      console.log(formatLog('info', message, data));
    }
  },

  debug: (message, data) => {
    if (shouldLog('debug')) {
      console.log(formatLog('debug', message, data));
    }
  }
};
