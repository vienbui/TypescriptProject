import { DataSource } from "typeorm";
import { Logger } from "winston";
import { Course } from "../entitites/course";
import { Lesson } from "../entitites/lesson";
import { User } from "../entitites/user";


export const AppDataSource = new DataSource ({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    entities:[
        Course,
        Lesson,
        User
    ],
    synchronize: true,
    logging:true
}); 