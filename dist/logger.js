"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var winston = require("winston");
exports.logger = winston.createLogger({
    level: process.env.LOGGER_LEVEL,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json({ space: 4 })),
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
    exports.logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
