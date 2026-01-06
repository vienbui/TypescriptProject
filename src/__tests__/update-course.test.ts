import { Request, Response, NextFunction } from 'express';
import { updateCourse } from '../route/update-course';
import {
  testCourse,
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

describe('Update Course API', () => {
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

  describe('PATCH /api/courses/id/:courseId', () => {
    it('should return 200 on successful update', async () => {
      req.params = { courseId: '1' };
      req.body = { title: 'Updated Title' };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.update.mockReturnThis();
      mockRepository.set.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.execute.mockResolvedValue({ affected: 1 });

      await updateCourse(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course 1 was updated successful',
      });
    });

    it('should throw error for invalid courseId', async () => {
      req.params = { courseId: 'invalid' };
      req.body = { title: 'Updated Title' };

      await updateCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next with error on database exception', async () => {
      req.params = { courseId: '1' };
      req.body = { title: 'Updated Title' };

      const error = new Error('Database error');
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.update.mockImplementation(() => {
        throw error;
      });

      await updateCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should update multiple fields', async () => {
      req.params = { courseId: '1' };
      req.body = {
        title: 'Updated Title',
        longDescription: 'Updated Description',
        category: 'ADVANCED',
      };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.update.mockReturnThis();
      mockRepository.set.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.execute.mockResolvedValue({ affected: 1 });

      await updateCourse(req as Request, res as Response, next);

      expect(mockRepository.set).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

