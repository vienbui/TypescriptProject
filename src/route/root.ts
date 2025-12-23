import {Request, Response} from 'express';

export function root(request: Request, response: Response) {
    response.status(200).send("Express server is running...");
}

