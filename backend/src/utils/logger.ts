import winston from 'winston';
import { config } from '../configs';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const stack = info.stack as string | undefined;
      const stackTrace = stack ? `\n${stack}` : '';
      return `${info.timestamp} [${info.level}]: ${info.message}${stackTrace}`;
    }
  )
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.server.env === 'development' ? developmentFormat : format,
  }),
];

// Add file transports in production
if (config.server.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: config.server.env === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format,
  transports,
});
