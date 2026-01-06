import { Request, Response, NextFunction } from 'express';
import { getAllCourses } from '../route/get-all-courses';
import {
  testCourse,
  testCourse2,
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

describe('Get All Courses API', () => {
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

  describe('GET /api/courses', () => {
    it('should return 200 with all courses', async () => {
      const courses = [testCourse, testCourse2];

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.getMany.mockResolvedValue(courses);
      mockRepository.getCount.mockResolvedValue(2);

      await getAllCourses(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        courses,
        totalCourses: 2,
      });
    });

    it('should return 200 with empty array when no courses exist', async () => {
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.getMany.mockResolvedValue([]);
      mockRepository.getCount.mockResolvedValue(0);

      await getAllCourses(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        courses: [],
        totalCourses: 0,
      });
    });

    it('should return 500 and call next on database error', async () => {
      const error = new Error('Database connection failed');

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.getMany.mockRejectedValue(error);

      await getAllCourses(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should order courses by seqNo in descending order', async () => {
      const courses = [testCourse2, testCourse]; // Higher seqNo first

      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.orderBy.mockReturnThis();
      mockRepository.getMany.mockResolvedValue(courses);
      mockRepository.getCount.mockResolvedValue(2);

      await getAllCourses(req as Request, res as Response, next);

      expect(mockRepository.orderBy).toHaveBeenCalledWith('course.seqNo', 'DESC');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

