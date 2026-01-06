import { Request, Response, NextFunction } from 'express';
import { createCourse } from '../route/create-course';
import {
  testCourse,
  mockRequest,
  mockResponse,
  mockNext,
} from './mocks/test-utils';
import { mockAppDataSource, mockRepository, mockTransactionManager, resetMocks } from './mocks/database.mock';

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

describe('Create Course API', () => {
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

  describe('POST /api/courses', () => {
    const newCourseData = {
      url: 'new-course',
      title: 'New Course',
      iconUrl: 'https://example.com/icon.png',
      longDescription: 'A brand new course',
      category: 'BEGINNER',
    };

    it('should return 201 with saved course on success', async () => {
      req.body = newCourseData;

      const savedCourse = {
        ...newCourseData,
        id: 1,
        seqNo: 1,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      // Mock the transaction
      mockAppDataSource.manager.transaction.mockImplementation(async (isolationLevel, callback) => {
        const repo = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
          create: jest.fn().mockReturnValue(savedCourse),
          save: jest.fn().mockResolvedValue(savedCourse),
        };
        const manager = {
          getRepository: jest.fn().mockReturnValue(repo),
        };
        return await callback(manager);
      });

      await createCourse(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ savedCourse });
    });

    it('should throw error if no data provided', async () => {
      req.body = null;

      await createCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should increment seqNo based on existing max', async () => {
      req.body = newCourseData;

      let capturedSeqNo: number | undefined;

      mockAppDataSource.manager.transaction.mockImplementation(async (isolationLevel, callback) => {
        const repo = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ max: 5 }),
          create: jest.fn().mockImplementation((data) => {
            capturedSeqNo = data.seqNo;
            return { ...data, id: 1 };
          }),
          save: jest.fn().mockResolvedValue({ ...newCourseData, id: 1, seqNo: 6 }),
        };
        const manager = {
          getRepository: jest.fn().mockReturnValue(repo),
        };
        return await callback(manager);
      });

      await createCourse(req as Request, res as Response, next);

      expect(capturedSeqNo).toBe(6);
    });

    it('should handle empty table (null max) correctly', async () => {
      req.body = newCourseData;

      let capturedSeqNo: number | undefined;

      mockAppDataSource.manager.transaction.mockImplementation(async (isolationLevel, callback) => {
        const repo = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation((data) => {
            capturedSeqNo = data.seqNo;
            return { ...data, id: 1 };
          }),
          save: jest.fn().mockResolvedValue({ ...newCourseData, id: 1, seqNo: 1 }),
        };
        const manager = {
          getRepository: jest.fn().mockReturnValue(repo),
        };
        return await callback(manager);
      });

      await createCourse(req as Request, res as Response, next);

      expect(capturedSeqNo).toBe(1);
    });

    it('should call next with error on database exception', async () => {
      req.body = newCourseData;

      const error = new Error('Transaction failed');
      mockAppDataSource.manager.transaction.mockRejectedValue(error);

      await createCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

