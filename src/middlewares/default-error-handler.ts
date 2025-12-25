import { NextFunction, Request, Response } from "express";
import { error } from "winston";
import { logger } from "../logger";


export async function getAllCourses(error, request: Request, response: Response, next: NextFunction) {

    logger.error (`Default error handler trigger, reason:`,error)

    if (response.headersSent){
        return next (error);
    }

    response.status(500).json ({ 
        status: "error",    
        message: "Internal Server Error"});

}