import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';

export async function getAllCourses(request: Request, response: Response, next: NextFunction) {

try {
    logger.debug("getAllCourses called");

    const courses = await AppDataSource
        .getRepository('Course')
        .createQueryBuilder("course")
        .orderBy("course.seqNo", "DESC")
        .getMany()


    response.status(200).json({courses})

} catch (error) {
    logger.error("Error in getAllCourses", error);
    response.status(500).json({error: "Internal Server Error"});
    return next(error);
}}
