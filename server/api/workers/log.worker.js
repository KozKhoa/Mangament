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
    const {
      requestId,
      method,
      protocol,
      httpVersion,
      host,
      url,
      path,
      query,
      params,
      statusCode,
      userAgent,
      requestBody,
      responseBody,
      userId,
      responseTime,
      ip,
      createdAt,
    } = job.data;

    await RequestLog.create({
      requestId: requestId || uuid7(),
      method: method,
      protocol: protocol,
      httpVersion: httpVersion,
      host: host,
      url: url,
      path: path,
      query: query,
      params: params,
      statusCode: statusCode,
      userAgent: userAgent,
      requestBody: requestBody,
      responseBody: responseBody,
      userId: userId ?? null,
      responseTime: responseTime,
      ip: ip,
      createdAt: createdAt,
    }).catch((err) => {
      logger.error("Cannot save request log", err);
    });

    console.log("Saved request log ", requestId, " successfully");
  },
  { connection, concurrency: 10 },
);

const auditLogWorker = new Worker(
  "save-audit-log",
  async (job) => {
    const {
      requestId,
      method,
      protocol,
      httpVersion,
      host,
      url,
      path,
      query,
      params,
      statusCode,
      userAgent,
      requestBody,
      responseBody,
      userId,
      responseTime,
      ip,
      createdAt,
    } = job.data;

    await AuditLog.create({
      requestId: requestId || uuid7(),
      method: method,
      protocol: protocol,
      httpVersion: httpVersion,
      host: host,
      url: url,
      path: path,
      query: query,
      params: params,
      statusCode: statusCode,
      userAgent: userAgent,
      requestBody: requestBody,
      responseBody: responseBody,
      userId: userId ?? null,
      responseTime: responseTime,
      ip: ip,
      createdAt: createdAt,
    }).catch((err) => {
      logger.error("Cannot save audit log", err);
    });

    console.log("Saved audit log ", requestId, " successfully");
  },
  { connection, concurrency: 10 },
);
export { requestLogWorker, auditLogWorker };
