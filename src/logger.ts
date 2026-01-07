import * as winston from 'winston';

const APP_NAME = process.env.APP_NAME || 'practicets-backend';

export const logger = winston.createLogger({
    level: process.env.LOGGER_LEVEL || 'info',
    defaultMeta: { 
        app: APP_NAME,
        service: 'api',
        environment: process.env.NODE_ENV || 'development'
    },
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json({ space: 4 })
    ),
    transports: [
        new winston.transports.File({
            filename: 'logs/all.log'
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),  
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, app, service, environment, ...meta }) => {
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `[${timestamp}] [${app}] ${level}: ${message}${metaStr}`;
            })
        )
    }));
}
