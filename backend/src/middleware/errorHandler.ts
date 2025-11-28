import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { config } from '../configs';
import { HTTP_STATUS } from '../utils/constants';

export function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction) {
  const errorId = uuidv4();
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isOperational = isAppError ? err.isOperational : false;
  
  // Log error details
  logger.error({
    errorId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    isOperational,
  });
  
  // Send error response
  const response: any = {
    errorId,
    message: config.server.env === 'development' || isOperational 
      ? err.message 
      : 'Internal Server Error',
  };
  
  // Include stack trace in development
  if (config.server.env === 'development') {
    response.stack = err.stack;
  }
  
  res.status(status).json(response);
  
  // Exit process for non-operational errors in production
  if (!isOperational && config.server.env === 'production') {
    logger.error('Non-operational error detected. Shutting down...');
    process.exit(1);
  }
}
