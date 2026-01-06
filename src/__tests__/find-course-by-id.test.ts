import { Request, Response, NextFunction } from 'express';
import { findCourseById } from '../route/find-course-by-id';
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

describe('Find Course By ID API', () => {
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

  describe('GET /api/courses/id/:courseId', () => {
    it('should return 200 with course and lesson count', async () => {
      req.params = { courseId: '1' };

      mockRepository.findOneBy.mockResolvedValue(testCourse);
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getCount.mockResolvedValue(5);

      await findCourseById(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        course: testCourse,
        totalLessons: 5,
      });
    });

    it('should return 404 if course not found', async () => {
      req.params = { courseId: '999' };

      mockRepository.findOneBy.mockResolvedValue(null);

      await findCourseById(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Could not find a course with id 999',
      });
    });

    it('should throw error if courseId is invalid (0 or NaN)', async () => {
      req.params = { courseId: 'invalid' };

      await findCourseById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next with error on database exception', async () => {
      req.params = { courseId: '1' };

      const error = new Error('Database error');
      mockRepository.findOneBy.mockRejectedValue(error);

      await findCourseById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should correctly query course by numeric id', async () => {
      req.params = { courseId: '42' };

      mockRepository.findOneBy.mockResolvedValue({ ...testCourse, id: 42 });
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getCount.mockResolvedValue(3);

      await findCourseById(req as Request, res as Response, next);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 42 });
    });
  });
});

