
import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import { isInteger} from "../utils";
import {Course} from '../entitites/course';
import { Lesson } from '../entitites/lesson';

export async function findLessonsForCourse(
    request: Request, response: Response, next:NextFunction) {

    try {

        logger.debug(`Called findLessonsForCourse()`);

        const  courseId = Number(request.params.courseId),
                query = request.query as any,
                pageNumber = query?.pageNumber ?? "0",
                pageSize = query?.pageSize ?? "3";

       

        if (!isInteger(pageNumber)) {
            throw `Invalid pageNumber ${pageNumber}`;
        }

        if (!isInteger(pageSize)) {
            throw `Invalid pageSize ${pageSize}`;
        }

        const lessons = await AppDataSource
            .getRepository(Lesson)
            .createQueryBuilder("lessons")
            .where("lessons.courseId = :courseId", {courseId})
            .orderBy("lessons.seqNo")
            .skip(pageNumber * pageSize)
            .take(pageSize)
            .getMany();

        response.status(200).json({lessons});

    }
    catch(error) {
        logger.error(`Error calling findLessonsForCourse()`);
        return next(error);
    }

}