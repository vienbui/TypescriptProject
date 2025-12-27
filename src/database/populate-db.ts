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
import {USERS} from "./db-data"
import { User } from '../entitites/user';


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

    const users = Object.values(USERS) as any[];

    for (let userData of users){
        console.log(`Inserting user: ${userData}`)
        
        const {email, pictureUrl, isAdmin, passwordSalt, plainTextPassword} = userData

        const user = AppDataSource
        .getRepository(User)
        .create({
            email,
            pictureUrl,
            isAdmin,
            passwordSalt,
            passwordHash: await calculatePasswordHash (plainTextPassword, passwordSalt)

        })
        await AppDataSource.manager.save(user);
    }

    const totalCourses = await courseRepository.createQueryBuilder("course").getCount();
    const totalLessons = await lessonRepository.createQueryBuilder("lesson").getCount();

    logger.info (`Total courses inserted: ${totalCourses}`);
    logger.info (`Total lessons inserted: ${totalLessons}`);
    
    
}
import { calculatePasswordHash } from '../utils';

populateDB()
    .then(() => {
        logger.info("Database has been populated successfully");
        process.exit(0);
    })
    .catch((error)=>{
        logger.error("Error populating database", error);
        process.exit(1);
    })