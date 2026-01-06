import * as express from 'express';
import { Request, Response, NextFunction } from 'express';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Sample test data
export const testUser = {
  id: 1,
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  passwordSalt: 'salt123',
  pictureUrl: 'https://example.com/pic.jpg',
  isAdmin: false,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const testAdminUser = {
  id: 2,
  email: 'admin@example.com',
  passwordHash: 'hashedpassword',
  passwordSalt: 'salt123',
  pictureUrl: 'https://example.com/admin.jpg',
  isAdmin: true,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const testCourse = {
  id: 1,
  seqNo: 1,
  url: 'typescript-basics',
  title: 'TypeScript Basics',
  iconUrl: 'https://example.com/ts-icon.png',
  longDescription: 'Learn TypeScript from scratch',
  category: 'BEGINNER',
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const testCourse2 = {
  id: 2,
  seqNo: 2,
  url: 'advanced-typescript',
  title: 'Advanced TypeScript',
  iconUrl: 'https://example.com/ts-advanced.png',
  longDescription: 'Master TypeScript patterns',
  category: 'ADVANCED',
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const testLesson = {
  id: 1,
  title: 'Introduction to Types',
  duration: '10:00',
  seqNo: 1,
  courseId: 1,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const testLesson2 = {
  id: 2,
  title: 'Advanced Types',
  duration: '15:00',
  seqNo: 2,
  courseId: 1,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

// Generate a valid JWT token for testing
export const generateTestToken = (user: { id: number; email: string; isAdmin: boolean }) => {
  return jwt.sign(
    {
      userID: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET
  );
};

// Generate authorization header
export const getAuthHeader = (user = testUser) => {
  const token = generateTestToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
  return `Bearer ${token}`;
};

export const getAdminAuthHeader = () => {
  return getAuthHeader(testAdminUser);
};

// Create a mock Express app for testing routes
export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

// Mock request and response objects
export const mockRequest = (options: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  user?: any;
} = {}): Partial<Request> => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user,
    ...options,
  } as Partial<Request>;
};

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext: NextFunction = jest.fn();

