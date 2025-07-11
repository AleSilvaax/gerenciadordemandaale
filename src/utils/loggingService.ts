
// Sistema de logging estruturado para substituir console.log desorganizado

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: Date;
}

class LoggingService {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context?: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date()
    };

    if (this.isDevelopment) {
      const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}]`;
      const contextStr = context ? ` [${context}]` : '';
      
      switch (level) {
        case 'error':
          console.error(`${prefix}${contextStr}`, message, data || '');
          break;
        case 'warn':
          console.warn(`${prefix}${contextStr}`, message, data || '');
          break;
        case 'debug':
          console.debug(`${prefix}${contextStr}`, message, data || '');
          break;
        default:
          console.log(`${prefix}${contextStr}`, message, data || '');
      }
    }
  }

  info(message: string, context?: string, data?: any) {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.log('error', message, context, data);
  }

  debug(message: string, context?: string, data?: any) {
    this.log('debug', message, context, data);
  }
}

export const logger = new LoggingService();

// Funções de conveniência para contextos específicos
export const pdfLogger = {
  info: (message: string, data?: any) => logger.info(message, 'PDF', data),
  warn: (message: string, data?: any) => logger.warn(message, 'PDF', data),
  error: (message: string, data?: any) => logger.error(message, 'PDF', data),
};

export const serviceLogger = {
  info: (message: string, data?: any) => logger.info(message, 'SERVICES', data),
  warn: (message: string, data?: any) => logger.warn(message, 'SERVICES', data),
  error: (message: string, data?: any) => logger.error(message, 'SERVICES', data),
};

export const authLogger = {
  info: (message: string, data?: any) => logger.info(message, 'AUTH', data),
  warn: (message: string, data?: any) => logger.warn(message, 'AUTH', data),
  error: (message: string, data?: any) => logger.error(message, 'AUTH', data),
};
