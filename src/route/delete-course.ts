import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import {Course} from '../entitites/course';
import { isInteger } from '../utils';
import { Lesson } from '../entitites/lesson';

export async function deleteCourseAndItsLessons(request: Request, response: Response, next: NextFunction) {

try {
     logger.debug("createCourse() called");

     const courseId = request.params.courseId;

     if (!isInteger(courseId)){
        throw new Error (`Invalid course Id ${courseId}`)
     }

     await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {

            await transactionalEntityManager
                .createQueryBuilder()
                .delete()
                .from(Lesson)
                .where("courseId = :courseId", {courseId})
                .execute()
            

             await transactionalEntityManager
                .createQueryBuilder()
                .delete()
                .from(Course)
                .where("id = :courseId", {courseId})
                .execute()
        }
     )

     response.status(200).json({
        message: `Course ${courseId} was deleted successfully`
     })
}
catch(error){
    logger.error("Error in delete course", error);
    return next(error);
}
}