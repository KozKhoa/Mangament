import { v7 as uuid7 } from "uuid";

import { AuditLog } from "../models/mongodb/audit-log.js";
import { RequestLog } from "../models/mongodb/request-log.js";
import logger from "../../configs/logger.js";

class LogService {
  async saveRequestLog(req, res, responseTime) {
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
  }

  async saveAuditLog(req, res, responseTime) {
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
  }
}

const logService = new LogService();

export default logService;
