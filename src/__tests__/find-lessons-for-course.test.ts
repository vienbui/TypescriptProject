import { Request, Response, NextFunction } from 'express';
import { findLessonsForCourse } from '../route/find-lesson-for-course';
import {
  testLesson,
  testLesson2,
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

describe('Find Lessons For Course API', () => {
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

  describe('GET /api/courses/id/:courseId/lessons', () => {
    it('should return 200 with lessons for the course', async () => {
      req.params = { courseId: '1' };
      req.query = {};

      const lessons = [testLesson, testLesson2];

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.skip.mockReturnThis();
      mockRepository.take.mockReturnThis();
      mockRepository.getMany.mockResolvedValue(lessons);

      await findLessonsForCourse(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ lessons });
    });

    it('should return empty array when no lessons exist', async () => {
      req.params = { courseId: '1' };
      req.query = {};

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.skip.mockReturnThis();
      mockRepository.take.mockReturnThis();
      mockRepository.getMany.mockResolvedValue([]);

      await findLessonsForCourse(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ lessons: [] });
    });

    it('should use default pagination values', async () => {
      req.params = { courseId: '1' };
      req.query = {};

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.skip.mockReturnThis();
      mockRepository.take.mockReturnThis();
      mockRepository.getMany.mockResolvedValue([]);

      await findLessonsForCourse(req as Request, res as Response, next);

      // Default pageNumber is 0, pageSize is 3
      expect(mockRepository.skip).toHaveBeenCalledWith(0);
      expect(mockRepository.take).toHaveBeenCalledWith('3');
    });

    it('should use custom pagination values', async () => {
      req.params = { courseId: '1' };
      req.query = { pageNumber: '2', pageSize: '5' };

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.skip.mockReturnThis();
      mockRepository.take.mockReturnThis();
      mockRepository.getMany.mockResolvedValue([]);

      await findLessonsForCourse(req as Request, res as Response, next);

      // pageNumber * pageSize = 2 * 5 = 10
      expect(mockRepository.skip).toHaveBeenCalledWith(10);
      expect(mockRepository.take).toHaveBeenCalledWith('5');
    });

    it('should throw error for invalid pageNumber', async () => {
      req.params = { courseId: '1' };
      req.query = { pageNumber: 'invalid' };

      await findLessonsForCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should throw error for invalid pageSize', async () => {
      req.params = { courseId: '1' };
      req.query = { pageNumber: '0', pageSize: 'invalid' };

      await findLessonsForCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next with error on database exception', async () => {
      req.params = { courseId: '1' };
      req.query = {};

      const error = new Error('Database error');
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.skip.mockReturnThis();
      mockRepository.take.mockReturnThis();
      mockRepository.getMany.mockRejectedValue(error);

      await findLessonsForCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should order lessons by seqNo', async () => {
      req.params = { courseId: '1' };
      req.query = {};

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.skip.mockReturnThis();
      mockRepository.take.mockReturnThis();
      mockRepository.getMany.mockResolvedValue([]);

      await findLessonsForCourse(req as Request, res as Response, next);

      expect(mockRepository.orderBy).toHaveBeenCalledWith('lessons.seqNo');
    });
  });
});

