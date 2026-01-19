import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to log incoming requests and outgoing responses.
 * Attaches a unique requestId to each request for correlation.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    // Attach requestId for correlation across logs
    req['requestId'] = requestId;
    
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length ? req.query : undefined,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('User-Agent'),
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        
        logger[logLevel]('Request completed', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req['user']?.userID || 'anonymous'
        });
    });

    next();
}



