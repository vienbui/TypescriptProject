import { Request, Response, NextFunction } from 'express';
import { findCourseByUrl } from '../route/find-course-by-url';
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

describe('Find Course By URL API', () => {
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

  describe('GET /api/courses/url/:courseUrl', () => {
    it('should return 200 with course and lesson count', async () => {
      req.params = { courseUrl: 'typescript-basics' };

      mockRepository.findOneBy.mockResolvedValue(testCourse);
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getCount.mockResolvedValue(5);

      await findCourseByUrl(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        course: testCourse,
        totalLessons: 5,
      });
    });

    it('should return 404 if course not found', async () => {
      req.params = { courseUrl: 'nonexistent-course' };

      mockRepository.findOneBy.mockResolvedValue(null);

      await findCourseByUrl(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Could not find a course with url nonexistent-course',
      });
    });

    it('should throw error if courseUrl is not provided', async () => {
      req.params = { courseUrl: '' };

      await findCourseByUrl(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next with error on database exception', async () => {
      req.params = { courseUrl: 'typescript-basics' };

      const error = new Error('Database error');
      mockRepository.findOneBy.mockRejectedValue(error);

      await findCourseByUrl(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should correctly query course by url string', async () => {
      req.params = { courseUrl: 'advanced-typescript' };

      mockRepository.findOneBy.mockResolvedValue({ ...testCourse, url: 'advanced-typescript' });
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.where.mockReturnThis();
      mockRepository.getCount.mockResolvedValue(10);

      await findCourseByUrl(req as Request, res as Response, next);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ url: 'advanced-typescript' });
    });
  });
});

