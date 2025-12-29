import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';

export async function getAllCourses(request: Request, response: Response, next: NextFunction) {
    console.log(">>> getAllCourses HIT");
try {
    logger.debug("getAllCourses called", request["user"]);

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
    logger.error("Error in getAllCourses", error);
    response.status(500).json({error: "Internal Server Error"});
    return next(error);
}}
