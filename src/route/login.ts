import {NextFunction, Request, Response} from 'express';
import { logger } from '../logger';
import { AppDataSource } from '../database/data-source';
import { User } from '../entitites/user';
import { calculatePasswordHash } from '../utils';

const JWT_SECRET = process.env.JWT_SECRET;
const jwt=require("jsonwebtoken");

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}

export async function login(request: Request, response: Response, next: NextFunction) {

try {
    const requestId = request['requestId'];
    logger.debug("login() called", { requestId });

    const {email, password} = request.body;

   if (!email) {
    logger.warn("Login attempt failed - email missing", { requestId: request['requestId'] });
    return response.status(400).json({
        status: "fail",
        message: "Email is required"
    })
   }

   if (!password) {
    logger.warn("Login attempt failed - password missing", { requestId: request['requestId'], email });
    return response.status(400).json({
        status: "fail",
        message: "password is required"
    })
   }

   const user = await AppDataSource
    .getRepository(User)
    .createQueryBuilder("users")
    .where("email = :email", {email})
    .getOne();

   if (!user) {
    logger.warn("Login attempt failed - user not found", { requestId: request['requestId'], email });
    return response.status(403).json({
        status: "fail",
        message: `Invalid email or password. Login denied with email ${email}.`
    })
   }

   const passwordHash = await calculatePasswordHash(password, user.passwordSalt);

   // compare the password hash that user input with the user's password hash in the database
   if (passwordHash !== user.passwordHash) {
    logger.warn("Login attempt failed - invalid password", { requestId: request['requestId'], email });
    return response.status(403).json({
        status: "fail",
        message: `Invalid password for email ${email}.`
    })
   }

   logger.info("Login successful", { requestId: request['requestId'], email, userId: user.id });

   const {pictureUrl, isAdmin} = user;

   const authJwt = {
    userID: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
   };

   const authJwtToken =jwt.sign(authJwt, JWT_SECRET)

   response.status(200).json({
    user: {
        email,
        pictureUrl,
        isAdmin
    },
    authJwtToken
   });

   return;
}
catch (error) {
    logger.error("Error in login", { requestId: request['requestId'], error: error.message, stack: error.stack });
    return next(error);
}
}