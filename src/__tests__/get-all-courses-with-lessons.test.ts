import { Request, Response, NextFunction } from 'express';
import { getAllCoursesWithLessons } from '../route/get-all-courses-with-lessons';
import {
  testCourse,
  testCourse2,
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

describe('Get All Courses With Lessons API', () => {
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

  describe('GET /api/courses-include-lessons', () => {
    it('should return 200 with courses, lessons, and counts', async () => {
      const coursesWithLessons = [
        { ...testCourse, lessons: [testLesson, testLesson2] },
        { ...testCourse2, lessons: [] },
      ];

      mockRepository.find.mockResolvedValue(coursesWithLessons);
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.getCount.mockResolvedValueOnce(2).mockResolvedValueOnce(2);

      await getAllCoursesWithLessons(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        courses: coursesWithLessons,
        totalCourses: 2,
        totalLessons: 2,
      });
    });

    it('should return 200 with empty arrays when no data exists', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.getCount.mockResolvedValue(0);

      await getAllCoursesWithLessons(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        courses: [],
        totalCourses: 0,
        totalLessons: 0,
      });
    });

    it('should return 500 on database error', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);

      await getAllCoursesWithLessons(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should include lessons relation in query', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.getCount.mockResolvedValue(0);

      await getAllCoursesWithLessons(req as Request, res as Response, next);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: {
            lessons: true,
          },
        })
      );
    });

    it('should order courses by seqNo descending', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.createQueryBuilder.mockReturnThis();
      mockRepository.getCount.mockResolvedValue(0);

      await getAllCoursesWithLessons(req as Request, res as Response, next);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: {
            seqNo: 'DESC',
          },
        })
      );
    });
  });
});

