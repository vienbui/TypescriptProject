import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import { User } from '../entitites/user';
import { calculatePasswordHash } from '../utils';

const crypto = require("crypto");

export async function createUser(request: Request, response: Response, next: NextFunction) {

try {
    logger.debug("RAW request.body =", request.body);

    const { email, pictureUrl, password,  isAdmin } = request.body;

    logger.debug("create User() called");       

    if (!email) {
        return response.status(400).json({
        status: "fail",
        message: "Could not extract the email from the request"
    })
    }
       
    if (!password) {
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
        return response.status(409).json({
        status:"fail",
        message: ` User with email ${email} already exists`,
        })
    }

    const passwordSalt = crypto.randomBytes(64).toString('hex')

    const passwordHash = await calculatePasswordHash(password, passwordSalt)

    logger.debug("Request body", request.body);


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
    logger.error("Error in create User", error);
    return next(error);
}}