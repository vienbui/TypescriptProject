import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';

export async function getAllCourses(request: Request, response: Response, next: NextFunction) {
    const requestId = request['requestId'];
try {
    logger.debug("getAllCourses called", { requestId, userId: request["user"]?.userID });

    const courses = await AppDataSource
        .getRepository('Course')
        .createQueryBuilder("course")
        .orderBy("course.seqNo", "DESC")
        .getMany()
    
    const totalCourses = await AppDataSource
            .getRepository('Course')
            .createQueryBuilder("course")
            .getCount()
    


    response.status(200).json({
        courses,
        totalCourses
    })

} catch (error) {
    logger.error("Error in getAllCourses", { requestId, error: error.message, stack: error.stack });
    return next(error);
}}
