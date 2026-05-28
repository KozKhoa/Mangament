import { v7 as uuid7 } from "uuid";

import logger from "../../configs/logger.js";
import logService from "../services/log.service.js";

export default async function RequestLogger(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const start = Date.now();

  res.on("finish", async function () {
    const duration = Date.now() - start; // Get the time for request to finish

    const requestId = uuid7();

    req.requestId = requestId;

    // Save request log to db
    await logService.saveRequestLog(req, res, duration).catch((err) => {
      logger.error("Cannot save request log", err);
    });

    if (req.isAudit === true) {
      await logService.saveAuditLog(req, res, duration).catch((err) => {
        logger.error("Cannot save audit log", err);
      });
    }
  });

  next();
}
