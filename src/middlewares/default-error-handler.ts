import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";


export function globalErrorHandler(error , request: Request, response: Response, next: NextFunction) {
    const requestId = request['requestId'];

    logger.error("Unhandled error caught by global error handler", {
        requestId,
        error: error.message,
        stack: error.stack,
        path: request.path,
        method: request.method,
        userId: request['user']?.userID || 'anonymous'
    });

    if (response.headersSent){
        return next (error);
    }

    response.status(500).json ({ 
        status: "error",    
        message: "Internal Server Error",
        requestId // Include requestId in response for debugging
    });

}

