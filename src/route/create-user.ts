import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import { User } from '../entitites/user';
import { calculatePasswordHash } from '../utils';

const crypto = require("crypto");

export async function createUser(request: Request, response: Response, next: NextFunction) {
    const requestId = request['requestId'];

try {
    const { email, pictureUrl, password,  isAdmin } = request.body;

    logger.debug("createUser() called", { requestId, createdBy: request['user']?.userID });       

    if (!email) {
        logger.warn("User creation failed - email missing", { requestId });
        return response.status(400).json({
        status: "fail",
        message: "Could not extract the email from the request"
    })
    }
       
    if (!password) {
        logger.warn("User creation failed - password missing", { requestId, email });
        return response.status(400).json({
        status: "fail",
        message: "password is required"
    })
    }

    const repository = await AppDataSource.getRepository(User)

    const user = await repository.createQueryBuilder("users")
                                .where("email = :email", {email})
                                .getOne();
    if (user){
        logger.warn("User creation failed - email already exists", { requestId, email });
        return response.status(409).json({
        status:"fail",
        message: ` User with email ${email} already exists`,
        })
    }

    const passwordSalt = crypto.randomBytes(64).toString('hex')

    const passwordHash = await calculatePasswordHash(password, passwordSalt)

    logger.debug("Creating new user", { requestId, email, isAdmin });


    const newUser = repository.create({
        email, 
        pictureUrl,
        isAdmin,
        passwordHash,
        passwordSalt
    })

    await AppDataSource.manager.save(newUser)

    logger.info("User created successfully", { requestId, email, userId: newUser.id, isAdmin })

    response.status(200).json({
        email, 
        pictureUrl,
        isAdmin
    })

}
catch (error) {
    logger.error("Error in createUser", { requestId, error: error.message, stack: error.stack });
    return next(error);
}}