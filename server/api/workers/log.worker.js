import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";

import { v7 as uuid7 } from "uuid";

import { RequestLog } from "../src/models/mongodb/request-log.js";
import { AuditLog } from "../src/models/mongodb/audit-log.js";

import logger from "../configs/logger.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const requestLogWorker = new Worker(
  "save-request-log",
  async (job) => {
    const { req, res, responseTime } = job.data;

    await RequestLog.create({
      requestId: req.requestId || uuid7(),
      method: req.method,
      protocol: req.protocol,
      httpVersion: req.httpVersion,
      host: req.hostname,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      params: req.params,
      statusCode: res.statusCode,
      userAgent: req.headers["user-agent"],
      requestBody: req.body,
      responseBody: res.body,
      userId: req.user?.id ?? null,
      responseTime: responseTime,
      ip: req.ip,
      createdAt: new Date(),
    }).catch((err) => {
      logger.error("Cannot save request log", err);
    });
  },
  { connection, concurrency: 20 },
);

const auditLogWorker = new Worker(
  "save-audit-log",
  async (job) => {
    const { req, res, responseTime } = job.data;

    await AuditLog.create({
      requestId: req.requestId || uuid7(),
      method: req.method,
      protocol: req.protocol,
      httpVersion: req.httpVersion,
      host: req.hostname,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      params: req.params,
      statusCode: res.statusCode,
      userAgent: req.headers["user-agent"],
      requestBody: req.body,
      responseBody: res.body,
      userId: req.user?.id ?? null,
      responseTime: responseTime,
      ip: req.ip,
      createdAt: new Date(),
    }).catch((err) => {
      logger.error("Cannot save audit log", err);
    });
  },
  { connection, concurrency: 20 },
);
export { requestLogWorker, auditLogWorker };
