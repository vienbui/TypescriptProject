import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import { User } from '../entitites/user';
import { error } from 'winston';
import { randomBytes } from 'crypto';
import { calculatePasswordHash } from '../utils';

const crypto = require("crypto");

export async function createUser(request: Request, response: Response, next: NextFunction) {

try {
    const { email, pictureUrl, password, plainTextPassword, isAdmin } = request.body;

    logger.debug("create User() called");

    

    if (!email) {
        throw "Could not extract the email from the request"
    }
       
    if (!password) {
        throw "Could not extract the password from the request"
    }

    const repository = await AppDataSource.getRepository(User)

    const user = await repository.createQueryBuilder("users")
                                .where("email = :email", {email})
                                .getOne();
    if (user){
        const message = ` User with email ${email} already exists`;
        logger.error(message);
        response.status(500).json({message});
        return;
    }

    const passwordSalt = crypto.randomBytes(64).toString('hex')

    const passwordHash = await calculatePasswordHash(password, passwordSalt)

    const newUser = repository.create({
        email, 
        pictureUrl,
        isAdmin,
        passwordHash,
        passwordSalt
    })

    await AppDataSource.manager.save(newUser)

    logger.info(`User ${email} has been created.`)

    response.status(200).json({
        email, 
        pictureUrl,
        isAdmin
    })

}
catch (error) {
    logger.error("Error in createCourse", error);
    return next(error);
}}