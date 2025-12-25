
import * as dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
    console.warn("No .env file found or error in loading .env file");
    process.exit(1);
}

import "reflect-metadata";
import * as express from 'express';
import { root } from './route/root';
import { isInteger } from './utils';
import { logger } from './logger';
import { AppDataSource } from './database/data-source';
import { getAllCourses } from './route/get-all-courses';
import  {findCourseByUrl} from './route/find-course-by-url'
import { findCourseById } from './route/find-course-by-id';
import { globalErrorHandler } from './middlewares/default-error-handler';
import {findLessonsForCourse} from './route/find-lesson-for-course';


const app = express();

function setupExpress(){
    
    app.route("/").get(root);
    app.route("/api/courses").get(getAllCourses);
    app.route("/api/courses/url/:courseUrl").get(findCourseByUrl);
    app.route("/api/courses/id/:courseId").get(findCourseById);
    app.route("/api/courses/id/:courseId/lessons").get(findLessonsForCourse);

    app.use(globalErrorHandler);

}

function startServer(){

    let port:number;

    const portEnv = process.env.PORT;
    const  portArg = process.argv[2]
    
    if (isInteger(portEnv)){
        port = parseInt(portEnv)
    }

    if (!port && isInteger(portArg)){
        port = parseInt(portArg);
    }

    if (!port){
        port = 9000;
    }
    app.listen(port,()=>{
        logger.info (`Server is running on http://localhost:${port}`);
    
    })
}
console.log('DB_PASSWORD =', process.env.DB_PASSWORD);
        console.log('DB_USERNAME =', process.env.DB_USERNAME);

AppDataSource.initialize()
    .then(()=>{
        logger.info("Data Source has been initialized!");
        setupExpress();
        startServer();
    

    })
    .catch((error)=> {
        logger.error("Error during Data Source initialization", error);
        

    });