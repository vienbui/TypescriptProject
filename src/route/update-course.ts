import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import { Course } from '../entitites/course';
import { Lesson } from '../entitites/lesson';
import {isInteger} from '../utils'

export async function updateCourse(request: Request, response: Response, next: NextFunction) {

try {

    logger.debug("updateCourse() called");

    const courseId = request.params.courseId,
        changes = request.body;

     if (!isInteger(courseId)) {
                throw `Invalid courseID ${courseId}`;
            }

    AppDataSource
            .createQueryBuilder()
            .update(Course)
            .set(changes)
            .where ("id = :courseId", {courseId})
            .execute();

    response.status(200).json({
        message: `Course ${courseId} was updated successful`
    })

    } catch (error) {
    logger.error("Error in findCourseById", error);
    return next(error);
}}