import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";
const JWT_SECRET = process.env.JWT_SECRET;
const jwt=require("jsonwebtoken");

export function checkIfAdmin(request: Request, response: Response, next: NextFunction) {

    const user = request["user"];

    if (!user?.isAdmin) {
        logger.error(`User is not an admin, access denied: ${user}`);
        response.sendStatus(403);
        return;
    }

    logger.info(`User is an admin, access granted: ${user}`);
    
    next();
}