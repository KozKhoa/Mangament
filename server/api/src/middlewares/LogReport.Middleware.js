import { v7 as uuid7 } from "uuid";

import logger from "../../configs/logger.js";

export default function RequestLogger(req, res, next) {
  const reqId = uuid7(); // Gen uuid for request id

  const start = Date.now();

  res.on("finish", function () {
    const duration = Date.now() - start; // Get the time for request to finish
    logger.info("Request handle", {
      reqId: reqId,
      method: req.method, // get ? post
      protocol: req.protocol, // http ? https
      httpVersion: req.httpVersion,
      host: req.hostname, // localhost ?
      url: req.originalUrl, // /auth/login ?
      ip: req.ip, // client ip
      statusCode: res.statusCode, // 200
      duration: `${duration}ms`, // Time need for server to response
      userAgent: req.headers["user-agent"], // Browser or agent ?
      userId: req.user?.id, // user id
    });
  });

  next();
}
