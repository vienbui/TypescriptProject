import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import {Course} from '../entitites/course';
import { Lesson } from '../entitites/lesson';

export async function getAllCoursesWithLessons(request: Request, response: Response, next: NextFunction) {

try {
    logger.debug("getAllCourses called");

    const courses = await AppDataSource
        .getRepository(Course)
        .find({
        relations: {
          lessons: true
        }
      });
    
    const totalCourses = await AppDataSource
            .getRepository('Course')
            .createQueryBuilder("course")
            .getCount()
    

     const totalLessons = await AppDataSource
            .getRepository('Lesson')
            .createQueryBuilder("lesson")
            .getCount()       

    response.status(200).json({
        courses,
        totalCourses,
        totalLessons
    })

} catch (error) {
    logger.error("Error in getAllCourses", error);
    response.status(500).json({error: "Internal Server Error"});
    return next(error);
}}
