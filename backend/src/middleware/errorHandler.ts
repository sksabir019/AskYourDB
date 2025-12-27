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
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    isOperational,
    status,
  });
  
  // Build user-friendly error response
  const response: any = {
    success: false,
    errorId,
    message: config.server.env === 'development' || isOperational 
      ? err.message 
      : 'An unexpected error occurred. Please try again later.',
    timestamp: new Date().toISOString(),
  };
  
  // Include stack trace in development
  if (config.server.env === 'development') {
    response.stack = err.stack;
    response.name = err.name;
  }
  
  // Add helpful hints for common errors
  if (err.message.includes('API key')) {
    response.hint = 'Check your .env file and ensure your API keys are correctly configured.';
  } else if (err.message.includes('rate limit')) {
    response.hint = 'You have exceeded the rate limit. Please wait a moment before trying again.';
  } else if (err.message.includes('quota')) {
    response.hint = 'Your API usage quota has been exceeded. Please check your account billing.';
  }
  
  res.status(status).json(response);
  
  // Exit process for non-operational errors in production
  if (!isOperational && config.server.env === 'production') {
    logger.error('Non-operational error detected. Shutting down...');
    process.exit(1);
  }
}
