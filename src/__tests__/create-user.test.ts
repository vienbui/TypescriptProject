import { Request, Response, NextFunction } from 'express';
import {
  testUser,
  testAdminUser,
  mockRequest,
  mockResponse,
  mockNext,
} from './mocks/test-utils';

// Mock modules BEFORE importing the module under test
jest.mock('../database/data-source');
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock('../utils', () => ({
  calculatePasswordHash: jest.fn().mockResolvedValue('hashedpassword'),
}));

// Import mocks and module under test AFTER jest.mock calls
import { createUser } from '../route/create-user';
import { AppDataSource } from '../database/data-source';

// Cast to mocked type for TypeScript
const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

// Create mock repository
const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  create: jest.fn(),
};

// Setup the mock implementation
(mockAppDataSource.getRepository as jest.Mock) = jest.fn().mockReturnValue(mockRepository);
(mockAppDataSource.manager as any) = {
  save: jest.fn(),
};

describe('Create User API', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
    
    // Reset mock implementations
    mockRepository.createQueryBuilder.mockReturnThis();
    mockRepository.where.mockReturnThis();
    (mockAppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  describe('POST /api/users', () => {
    const newUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      pictureUrl: 'https://example.com/pic.jpg',
      isAdmin: false,
    };

    it('should return 400 if email is not provided', async () => {
      req.body = { password: 'password123' };

      await createUser(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Could not extract the email from the request',
      });
    });

    it('should return 400 if password is not provided', async () => {
      req.body = { email: 'test@example.com' };

      await createUser(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'password is required',
      });
    });

    it('should return 409 if user already exists', async () => {
      req.body = newUserData;

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockResolvedValue(testUser);

      await createUser(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: ` User with email ${newUserData.email} already exists`,
      });
    });

    it('should return 200 with user data on successful creation', async () => {
      req.body = newUserData;

      const createdUser = {
        id: 3,
        ...newUserData,
        passwordHash: 'hashedpassword',
        passwordSalt: 'randomsalt',
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdUser);
      (mockAppDataSource.manager.save as jest.Mock).mockResolvedValue(createdUser);

      await createUser(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        email: newUserData.email,
        pictureUrl: newUserData.pictureUrl,
        isAdmin: newUserData.isAdmin,
      });
    });

    it('should create admin user when isAdmin is true', async () => {
      const adminUserData = {
        email: 'admin@example.com',
        password: 'adminpass',
        pictureUrl: 'https://example.com/admin.jpg',
        isAdmin: true,
      };

      req.body = adminUserData;

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...adminUserData, id: 4 });
      (mockAppDataSource.manager.save as jest.Mock).mockResolvedValue({ ...adminUserData, id: 4 });

      await createUser(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        email: adminUserData.email,
        pictureUrl: adminUserData.pictureUrl,
        isAdmin: true,
      });
    });

    it('should call next with error on database exception', async () => {
      req.body = newUserData;

      const error = new Error('Database error');
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockRejectedValue(error);

      await createUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should not expose password hash or salt in response', async () => {
      req.body = newUserData;

      const createdUser = {
        id: 3,
        ...newUserData,
        passwordHash: 'hashedpassword',
        passwordSalt: 'randomsalt',
      };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdUser);
      (mockAppDataSource.manager.save as jest.Mock).mockResolvedValue(createdUser);

      await createUser(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.any(String),
          passwordHash: expect.any(String),
          passwordSalt: expect.any(String),
        })
      );
    });
  });
});

