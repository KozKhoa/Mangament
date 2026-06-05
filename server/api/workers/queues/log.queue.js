import { redis } from "../../configs/redis.js";
import { Queue } from "bullmq";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const ATTEMP = 3;
const DELAY = 5000;

const ADD_JOB_OPTION = { attempts: ATTEMP, backoff: { type: "exponential", delay: DELAY }, removeOnComplete: true, removeOnFail: true };

class LogQueue {
  #requestLogQueue = new Queue("save-request-log", { connection });
  #auditLogQueue = new Queue("save-audit-log", { connection });

  async addJob_SaveRequestLog({
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
  }) {
    await this.#requestLogQueue.add(
      "saveRequestLog",
      {
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
      },
      ADD_JOB_OPTION,
    );
  }

  async addJob_SaveAuditLog({
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
  }) {
    await this.#auditLogQueue.add(
      "saveAuditLog",
      {
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
      },
      ADD_JOB_OPTION,
    );
  }
}

const logQueue = new LogQueue();
export default logQueue;
