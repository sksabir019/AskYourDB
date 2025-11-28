import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../configs';
import { logger } from '../../utils/logger';
import { AuthenticationError } from '../../utils/errors';

interface LoginRequest {
  email: string;
  password: string;
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginRequest;
    
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required');
    }
    
    // For demo purposes, accept any email/password
    // In production, verify credentials against database
    const user = {
      id: '1',
      email,
      role: 'user',
    };
    
    // Generate JWT token
    const payload = { id: user.id, email: user.email, role: user.role };
    const secret = config.jwt.secret;
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    
    logger.info(`User logged in: ${email}`);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    return next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required');
    }
    
    // For demo purposes, accept any registration
    // In production, hash password and save to database
    const user = {
      id: Date.now().toString(),
      email,
      name: name || email.split('@')[0],
      role: 'user',
    };
    
    // Generate JWT token
    const payload = { id: user.id, email: user.email, role: user.role };
    const secret = config.jwt.secret;
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    
    logger.info(`User registered: ${email}`);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return next(error);
  }
}
