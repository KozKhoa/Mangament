import { v7 as uuid7 } from "uuid";

import { AuditLog } from "../models/mongodb/audit-log.js";
import { RequestLog } from "../models/mongodb/request-log.js";
import logger from "../../configs/logger.js";

import logQueue from "../../queues/log.queue.js";

class LogService {
  async saveRequestLog(req, res, responseTime) {
    await logQueue.addJob_SaveRequestLog(req, res, responseTime);
  }

  async saveAuditLog(req, res, responseTime) {
    await logQueue.addJob_SaveAuditLog(req, res, responseTime);
  }
}

const logService = new LogService();
export default logService;
