import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../configs';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { ERROR_MESSAGES } from '../utils/constants';

export interface AuthRequest extends Request { 
  user?: {
    id: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError(ERROR_MESSAGES.MISSING_AUTH);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError(ERROR_MESSAGES.MISSING_AUTH);
    }
    
    if (!config.jwt.secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const payload = jwt.verify(token, config.jwt.secret) as any;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError(ERROR_MESSAGES.INVALID_TOKEN));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token has expired'));
    } else {
      next(error);
    }
  }
}

export function permit(...allowedRoles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError(ERROR_MESSAGES.MISSING_AUTH);
      }
      
      const userRole = req.user.role;
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new AuthorizationError(ERROR_MESSAGES.FORBIDDEN);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
