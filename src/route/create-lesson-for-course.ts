
import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import {Course} from '../entitites/course';

import { error } from 'winston';
import { Lesson } from '../entitites/lesson';

export async function createLessonForCourse(request: Request,response: Response,next: NextFunction) {
  try {
    const courseId = Number(request.params.courseId);
    const data = request.body;

    if (!courseId) {
      throw new Error("Invalid courseId");
    }

    if (!data) {
      throw new Error("No lesson data provided");
    }

    const savedLesson = await AppDataSource.manager.transaction(
      "REPEATABLE READ",
      async (manager) => {

        const courseRepo = manager.getRepository(Course);
        const lessonRepo = manager.getRepository(Lesson);

        // 1️⃣ Check course exists
        const course = await courseRepo.findOneBy({ id: courseId });

        if (!course) {
          throw new Error(`Course ${courseId} not found`);
        }

        // 2️⃣ Get max lesson seqNo for this course
        const result = await lessonRepo
          .createQueryBuilder("lesson")
          .select("MAX(lesson.seqNo)", "max")
          .where("lesson.courseId = :courseId", { courseId })
          .getRawOne();

        // 3️⃣ Create lesson
        const lesson = lessonRepo.create({
          ...data,
          seqNo: (result?.max ?? 0) + 1,
          course,
          courseId
        });

        await lessonRepo.save(lesson);

        return lesson;
      }
    );

    response.status(201).json({ lesson: savedLesson });

  } catch (error) {
    return next(error);
  }
}

