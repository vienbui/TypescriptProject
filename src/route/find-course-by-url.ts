import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import {Course} from '../entitites/course';
import { Lesson } from '../entitites/lesson';

export async function findCourseByUrl(request: Request, response: Response, next: NextFunction) {

try {
    logger.debug("findCourseByUrl() called");

    const courseUrl = request.params.courseUrl;

    if (!courseUrl){
        throw new Error (`Course does not exist`)
    }

    const course = await AppDataSource
        .getRepository(Course)
        .findOneBy({
            url: courseUrl
        })
 

    if (!course){
        const message = `Could not find a course with url ${courseUrl}`;
            logger.error(message);
            response.status(404).json({message});
            return;
    }

    const totalLessons = await AppDataSource
        .getRepository(Lesson)
        .createQueryBuilder("lesson")
        .where("lesson.courseId = :courseId",{
            courseId: course.id
        })
        .getCount()


    response.status(200).json({
        course,
        totalLessons
    })

} catch (error) {
    logger.error("Error in findCourseByUrl", error);
    return next(error);
}}
