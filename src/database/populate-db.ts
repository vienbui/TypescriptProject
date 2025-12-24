
import * as dotenv from 'dotenv';

const result = dotenv.config();

import "reflect-metadata";
import {COURSES} from "./db-data"
import { logger } from '../logger';
import { AppDataSource } from './data-source';
import { log } from 'winston';
import { DeepPartial } from 'typeorm';
import { Course } from '../entitites/course';
import { Lesson } from '../entitites/lesson';

async function populateDB(){

    await AppDataSource.initialize();
    logger.info('Database connection established');

    const courses = Object.values(COURSES) as DeepPartial<Course>[];

    const courseRepository = AppDataSource.getRepository(Course);
    const lessonRepository = AppDataSource.getRepository(Lesson);

    for (let courseData of courses){
        logger.info (`Inserted course ${courseData.title}`);

        const course = courseRepository.create(courseData);
        
        await courseRepository.save(course);

        for (let lessonData of courseData.lessons!){
            logger.info (`Inserted lesson ${lessonData.title}`);

            const lesson = lessonRepository.create(lessonData);

            //link a lesson to a course
            lesson.course = course;
        
            await lessonRepository.save(lesson);
        }
    }

    const totalCourses = await courseRepository.createQueryBuilder("course").getCount();
    const totalLessons = await lessonRepository.createQueryBuilder("lesson").getCount();

    logger.info (`Total courses inserted: ${totalCourses}`);
    logger.info (`Total lessons inserted: ${totalLessons}`);
    
}

populateDB()
    .then(() => {
        logger.info("Database has been populated successfully");
        process.exit(0);
    })
    .catch((error)=>{
        console.error("Error populating database", error);
        process.exit(1);
    })