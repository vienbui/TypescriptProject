import { Request, Response, NextFunction } from 'express';
import { createLessonForCourse } from '../route/create-lesson-for-course';
import {
  testCourse,
  testLesson,
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

describe('Create Lesson For Course API', () => {
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

  describe('POST /api/courses/id/:courseId/lessons', () => {
    const newLessonData = {
      title: 'New Lesson',
      duration: '15:00',
    };

    it('should return 201 with saved lesson on success', async () => {
      req.params = { courseId: '1' };
      req.body = newLessonData;

      const savedLesson = {
        ...newLessonData,
        id: 1,
        seqNo: 1,
        courseId: 1,
        course: testCourse,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockAppDataSource.manager.transaction.mockImplementation(async (isolationLevel, callback) => {
        const courseRepo = {
          findOneBy: jest.fn().mockResolvedValue(testCourse),
        };
        const lessonRepo = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
          create: jest.fn().mockReturnValue(savedLesson),
          save: jest.fn().mockResolvedValue(savedLesson),
        };
        const manager = {
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity.name === 'Course') return courseRepo;
            return lessonRepo;
          }),
        };
        return await callback(manager);
      });

      await createLessonForCourse(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ lesson: savedLesson });
    });

    it('should throw error if courseId is invalid', async () => {
      req.params = { courseId: 'invalid' };
      req.body = newLessonData;

      await createLessonForCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should throw error if no lesson data provided', async () => {
      req.params = { courseId: '1' };
      req.body = null;

      await createLessonForCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should throw error if course not found', async () => {
      req.params = { courseId: '999' };
      req.body = newLessonData;

      mockAppDataSource.manager.transaction.mockImplementation(async (isolationLevel, callback) => {
        const courseRepo = {
          findOneBy: jest.fn().mockResolvedValue(null),
        };
        const lessonRepo = {
          createQueryBuilder: jest.fn().mockReturnThis(),
        };
        const manager = {
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity.name === 'Course') return courseRepo;
            return lessonRepo;
          }),
        };
        return await callback(manager);
      });

      await createLessonForCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should increment seqNo based on existing max for the course', async () => {
      req.params = { courseId: '1' };
      req.body = newLessonData;

      let capturedSeqNo: number | undefined;

      mockAppDataSource.manager.transaction.mockImplementation(async (isolationLevel, callback) => {
        const courseRepo = {
          findOneBy: jest.fn().mockResolvedValue(testCourse),
        };
        const lessonRepo = {
          createQueryBuilder: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ max: 5 }),
          create: jest.fn().mockImplementation((data) => {
            capturedSeqNo = data.seqNo;
            return { ...data, id: 1 };
          }),
          save: jest.fn().mockResolvedValue({ ...newLessonData, id: 1, seqNo: 6 }),
        };
        const manager = {
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity.name === 'Course') return courseRepo;
            return lessonRepo;
          }),
        };
        return await callback(manager);
      });

      await createLessonForCourse(req as Request, res as Response, next);

      expect(capturedSeqNo).toBe(6);
    });

    it('should call next with error on transaction failure', async () => {
      req.params = { courseId: '1' };
      req.body = newLessonData;

      const error = new Error('Transaction failed');
      mockAppDataSource.manager.transaction.mockRejectedValue(error);

      await createLessonForCourse(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

