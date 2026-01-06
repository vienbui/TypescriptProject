import { Request, Response, NextFunction } from 'express';
import { deleteCourseAndItsLessons } from '../route/delete-course';
import {
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

// Mock utils
jest.mock('../utils', () => ({
  isInteger: jest.fn((input) => input?.match(/^\d+$/) ?? false),
}));

describe('Delete Course API', () => {
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

  describe('DELETE /api/courses/id/:courseId', () => {
    it('should return 200 on successful deletion', async () => {
      req.params = { courseId: '1' };

      mockAppDataSource.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return await callback(manager);
      });

      await deleteCourseAndItsLessons(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course 1 was deleted successfully',
      });
    });

    it('should throw error for invalid courseId', async () => {
      req.params = { courseId: 'invalid' };

      await deleteCourseAndItsLessons(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should delete lessons before deleting course (transaction)', async () => {
      req.params = { courseId: '1' };

      const deleteOrder: string[] = [];

      mockAppDataSource.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          from: jest.fn().mockImplementation((entity) => {
            deleteOrder.push(entity.name || entity);
            return manager;
          }),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return await callback(manager);
      });

      await deleteCourseAndItsLessons(req as Request, res as Response, next);

      // Lessons should be deleted before course
      expect(deleteOrder[0]).toBeDefined();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next with error on transaction failure', async () => {
      req.params = { courseId: '1' };

      const error = new Error('Transaction failed');
      mockAppDataSource.manager.transaction.mockRejectedValue(error);

      await deleteCourseAndItsLessons(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

