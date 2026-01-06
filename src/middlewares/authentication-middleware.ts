import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";
const JWT_SECRET = process.env.JWT_SECRET;
const jwt=require("jsonwebtoken");

export function checkIfAuthenticated(request: Request, response: Response, next: NextFunction) {
    const requestId = request['requestId'];
    logger.debug("Authentication middleware invoked", { requestId, path: request.path });

    const authJwtToken = request.headers.authorization;

    if (!authJwtToken) {
       response.status(403).json({
        error: "Authentication JWT is not present, access denied"
       });
       return;
    }

    let token = authJwtToken;

  if (authJwtToken.startsWith("Bearer ")) {
    token = authJwtToken.substring("Bearer ".length);
  }

    checkJwtValidity(token)
        .then((user) => {
            logger.info(`Autentication JWT successfully decoded: ${user}`);

            request["user"] = user;
            next();
            
        })
        .catch((error) => {
            logger.error(`Could not validate the authentication JWT, access denied`, error);
            response.sendStatus(403);
            return;
        });
}

async function checkJwtValidity (authJwtToken: string) {
    
    const user =await jwt.verify(authJwtToken, JWT_SECRET);
    
    authJwtToken = authJwtToken.trim();

    logger.debug("Found user details in JWT", { userId: user.userID, email: user.email });

    return user;
}