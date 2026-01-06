import { Request, Response, NextFunction } from 'express';
import { login } from '../route/login';
import {
  testUser,
  mockRequest,
  mockResponse,
  mockNext,
} from './mocks/test-utils';
import { mockAppDataSource, mockRepository, resetMocks } from './mocks/database.mock';

// Mock the data source
jest.mock('../database/data-source', () => {
  const { mockAppDataSource } = require('./mocks/database.mock');
  return { AppDataSource: mockAppDataSource };
});

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the utils
jest.mock('../utils', () => ({
  calculatePasswordHash: jest.fn(),
}));

import { calculatePasswordHash } from '../utils';

describe('Login API', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    resetMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
    jest.clearAllMocks();
  });

  describe('POST /api/login', () => {
    it('should return 400 if email is not provided', async () => {
      req.body = { password: 'password123' };

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Email is required',
      });
    });

    it('should return 400 if password is not provided', async () => {
      req.body = { email: 'test@example.com' };

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'password is required',
      });
    });

    it('should return 403 if user is not found', async () => {
      req.body = { email: 'nonexistent@example.com', password: 'password123' };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockResolvedValue(null);

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid email or password. Login denied with email nonexistent@example.com.',
      });
    });

    it('should return 403 if password is incorrect', async () => {
      req.body = { email: testUser.email, password: 'wrongpassword' };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockResolvedValue({
        ...testUser,
        passwordHash: 'correcthash',
        passwordSalt: 'salt',
      });

      (calculatePasswordHash as jest.Mock).mockResolvedValue('wronghash');

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: `Invalid password for email ${testUser.email}.`,
      });
    });

    it('should return 200 with JWT token on successful login', async () => {
      req.body = { email: testUser.email, password: 'correctpassword' };

      const userWithPassword = {
        ...testUser,
        passwordHash: 'correcthash',
        passwordSalt: 'salt',
      };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockResolvedValue(userWithPassword);

      (calculatePasswordHash as jest.Mock).mockResolvedValue('correcthash');

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: {
            email: testUser.email,
            pictureUrl: testUser.pictureUrl,
            isAdmin: testUser.isAdmin,
          },
          authJwtToken: expect.any(String),
        })
      );
    });

    it('should call next with error on exception', async () => {
      req.body = { email: testUser.email, password: 'password123' };

      const error = new Error('Database error');
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockRejectedValue(error);

      await login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

