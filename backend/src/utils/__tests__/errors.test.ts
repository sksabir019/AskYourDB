import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  LLMError,
} from '../errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and status', () => {
      const error = new AppError('Test error', 500);
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should set isOperational flag', () => {
      const operationalError = new AppError('Operational', 400, true);
      const nonOperationalError = new AppError('Critical', 500, false);
      
      expect(operationalError.isOperational).toBe(true);
      expect(nonOperationalError.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should have status 400', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid input');
    });
  });

  describe('AuthenticationError', () => {
    it('should have status 401', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error.status).toBe(401);
      expect(error.message).toBe('Invalid token');
    });

    it('should use default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Authentication failed');
    });
  });

  describe('AuthorizationError', () => {
    it('should have status 403', () => {
      const error = new AuthorizationError('Access denied');
      
      expect(error.status).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should have status 404', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error.status).toBe(404);
    });
  });

  describe('DatabaseError', () => {
    it('should have status 500', () => {
      const error = new DatabaseError('Connection failed');
      
      expect(error.status).toBe(500);
      expect(error.message).toBe('Connection failed');
    });
  });

  describe('LLMError', () => {
    it('should have status 503', () => {
      const error = new LLMError('API unavailable');
      
      expect(error.status).toBe(503);
      expect(error.message).toBe('API unavailable');
    });
  });
});
