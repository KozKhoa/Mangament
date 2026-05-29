import winston from "winston";
const { combine, timestamp, errors, prettyPrint, json } = winston.format;

const LOG_FILE_STANDARD = "./logs/standard.log";
const LOG_FILE_REJECTION = "./logs/rejection.log";
const LOG_FILE_EXCEPTION = "./logs/exception.log";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [new winston.transports.File({ filename: LOG_FILE_STANDARD }), new winston.transports.Console({ format: combine(prettyPrint()) })],
  rejectionHandlers: [new winston.transports.File({ filename: LOG_FILE_REJECTION }), new winston.transports.Console({ format: prettyPrint() })],
  exceptionHandlers: [new winston.transports.File({ filename: LOG_FILE_EXCEPTION }), new winston.transports.Console({ format: prettyPrint() })],
});

export default logger;
