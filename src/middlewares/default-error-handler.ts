import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";


export function globalErrorHandler(error , request: Request, response: Response, next: NextFunction) {

    logger.error (`Default error handler trigger, reason:`,error)

    if (response.headersSent){
        return next (error);
    }

    response.status(500).json ({ 
        status: "error",    
        message: "Internal Server Error"});

}

