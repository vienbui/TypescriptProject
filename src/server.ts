
import * as dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
    console.warn("No .env file found or error in loading .env file");
    process.exit(1);
}

console.log(process.env.PORT);

import * as express from 'express';
import { root } from './route/root';
import { isInteger } from './utils';
import { logger } from './logger';

const app = express();

function setupExpress(){

   
    
    app.route("/").get(root);


}

function startServer(){

    let port:number;

    const portEnv = process.env.PORT;
    const  portArg = process.argv[2]
    
    if (isInteger(portEnv)){
        port = parseInt(portEnv)
    }

    if (!port && isInteger(portArg)){
        port = parseInt(portArg);
    }

    if (!port){
        port = 9000;
    }
    app.listen(port,()=>{
        logger.info (`Server is running on http://localhost:${port}`);
    })
}

setupExpress();
startServer();