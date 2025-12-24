import * as dotenv from 'dotenv';

const result = dotenv.config();

import "reflect-metadata";
import { logger } from '../logger';
import { AppDataSource } from './data-source';
import { Lesson } from '../entitites/lesson';
import { Course } from '../entitites/course';

async function deleteDB(){

     await AppDataSource.initialize();
    logger.info('Database connection established');

    // cannot use instruction code below due to foreign key constraint. 
    //TypeORM does not allow delete() without conditions to prevent accidental full-table deletes.
    // 

    // logger.info("Delete data in LESSONS table");
    // await AppDataSource.getRepository(Lesson).clear()
        
    // logger.info("Delete data in COURSES table");
    // await AppDataSource.getRepository(Course).clear()

    await AppDataSource
  .createQueryBuilder()
  .delete()
  .from(Lesson)
  .execute();

await AppDataSource
  .createQueryBuilder()
  .delete()
  .from(Course)
  .execute();
   

}

deleteDB()
    .then(() => {
        logger.info("Database has been deleted successfully");
        process.exit(0);
    })
    .catch((error)=>{
        logger.error("Error deleting database", error);
        process.exit(1);
    })