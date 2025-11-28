// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.DB_ENGINE = 'mongo';
process.env.MONGO_URI = 'mongodb://localhost:27017/askyourdb_test';

// Suppress console output during tests
globalThis.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
