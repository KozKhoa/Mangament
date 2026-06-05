import logQueue from "../../workers/queues/log.queue.js";

class LogService {
  async saveRequestLog(req, res, responseTime) {
    await logQueue.addJob_SaveRequestLog({
      requestId: req.requestId,
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
    });
  }

  async saveAuditLog(req, res, responseTime) {
    await logQueue.addJob_SaveAuditLog({
      requestId: req.requestId,
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
    });
  }
}

const logService = new LogService();
export default logService;
