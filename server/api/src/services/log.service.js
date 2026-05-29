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
