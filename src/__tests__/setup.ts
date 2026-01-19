// Test setup file
import 'reflect-metadata';

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test';

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  // Uncomment to silence logs during tests:
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
};



