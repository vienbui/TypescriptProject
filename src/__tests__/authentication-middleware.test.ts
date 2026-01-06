import { Request, Response, NextFunction } from 'express';
import { checkIfAuthenticated } from '../middlewares/authentication-middleware';
import { checkIfAdmin } from '../middlewares/authentication-admin-only-middleware';
import {
  testUser,
  testAdminUser,
  generateTestToken,
  mockRequest,
  mockResponse,
  mockNext,
} from './mocks/test-utils';

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkIfAuthenticated', () => {
    it('should return 403 if no authorization header is provided', () => {
      req.headers = {};

      checkIfAuthenticated(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication JWT is not present, access denied',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with user on valid JWT', async () => {
      const token = generateTestToken({
        id: testUser.id,
        email: testUser.email,
        isAdmin: testUser.isAdmin,
      });
      req.headers = { authorization: token };

      checkIfAuthenticated(req as Request, res as Response, next);

      // Wait for async JWT verification
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(next).toHaveBeenCalled();
      expect(req['user']).toBeDefined();
    });

    it('should handle Bearer prefix in token', async () => {
      const token = generateTestToken({
        id: testUser.id,
        email: testUser.email,
        isAdmin: testUser.isAdmin,
      });
      req.headers = { authorization: `Bearer ${token}` };

      checkIfAuthenticated(req as Request, res as Response, next);

      // Wait for async JWT verification
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for invalid JWT', async () => {
      req.headers = { authorization: 'invalid-token' };

      checkIfAuthenticated(req as Request, res as Response, next);

      // Wait for async JWT verification
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(res.sendStatus).toHaveBeenCalledWith(403);
    });

    it('should return 403 for expired JWT', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        {
          userID: testUser.id,
          email: testUser.email,
          isAdmin: testUser.isAdmin,
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );
      req.headers = { authorization: expiredToken };

      checkIfAuthenticated(req as Request, res as Response, next);

      // Wait for async JWT verification
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(res.sendStatus).toHaveBeenCalledWith(403);
    });
  });

  describe('checkIfAdmin', () => {
    it('should return 403 if user is not admin', () => {
      req['user'] = { ...testUser, isAdmin: false };

      checkIfAdmin(req as Request, res as Response, next);

      expect(res.sendStatus).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user is admin', () => {
      req['user'] = { ...testAdminUser, isAdmin: true };

      checkIfAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.sendStatus).not.toHaveBeenCalled();
    });

    it('should return 403 if user object is not present', () => {
      req['user'] = undefined;

      checkIfAdmin(req as Request, res as Response, next);

      expect(res.sendStatus).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user.isAdmin is explicitly false', () => {
      req['user'] = { id: 1, email: 'test@example.com', isAdmin: false };

      checkIfAdmin(req as Request, res as Response, next);

      expect(res.sendStatus).toHaveBeenCalledWith(403);
    });
  });
});

