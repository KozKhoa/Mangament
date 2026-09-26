import { redis } from "../../../configs/redis.js";

export const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};
