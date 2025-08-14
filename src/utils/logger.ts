/**
 * Logging utility using Winston
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Create logger instance - MCP 服务器默认只记录到文件，避免污染 stdout
export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info', // 提高默认日志级别以便记录业务信息
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'cmmi-specs-mcp' },
  transports: [
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

// 仅在开发模式下添加控制台输出，并且输出到 stderr 而不是 stdout
if (process.env['NODE_ENV'] === 'development' && process.env['DEBUG_MCP']) {
  logger.add(new winston.transports.Console({
    stderrLevels: ['error', 'warn', 'info', 'debug'], // 强制所有级别输出到 stderr
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.simple()
    )
  }));
}

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch (error) {
  // Directory might already exist
}

export default logger;
