import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import {Course} from '../entitites/course';

export async function createCourse(request: Request, response: Response, next: NextFunction) {

try {
    logger.debug("createCourse() called");

    const data = request.body;

    if (!data){
       throw  new Error (`No data available, cannot save course`);

    }

    const savedCourse = await AppDataSource.manager.transaction (
        "REPEATABLE READ", 
        async (transactionalEntityManager) => {

            const repository = transactionalEntityManager.getRepository(Course)
                

            const result = await repository
                .createQueryBuilder("courses")
                .select("MAX(courses.seqNo)", "max")
                .getRawOne();

           const newCourse = repository
                .create({
                    ...data, //Object spead operator ( create a copy of data),
                      seqNo: ( result?.max ?? 0 ) + 1 // result maybe empty => use optinal chaining and null coalescing to have dafault value
                })

            await repository.save(newCourse) ;

            return newCourse; // to make course is available outside of transaction so that we can use it in response json
        }
    );
       response.status(201).json({savedCourse})
       

}
catch (error) {
    logger.error("Error in createCourse", error);
    return next(error);
}}