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
    logger.debug("login() called");

    const {email, password} = request.body;

   if (!email) {
    return response.status(400).json({
        status: "fail",
        message: "Email is required"
    })
   }
   console.log("JWT_SECRET =", process.env.JWT_SECRET);


   if (!password) {
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
    return response.status(403).json({
        status: "fail",
        message: `Invalid email or password. Login denied with email ${email}.`
    })
   }

   const passwordHash = await calculatePasswordHash(password, user.passwordSalt);

   // compare the password hash that user input with the user's password hash in the database
   if (passwordHash !== user.passwordHash) {
    return response.status(403).json({
        status: "fail",
        message: `Invalid password for email ${email}.`
    })
   }

   logger.info(`Login successful for email ${email}.`);

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
    logger.error("Error in login", error);
    return next(error);
}
}