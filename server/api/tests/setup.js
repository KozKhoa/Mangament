import { vi } from "vitest";

// Global mock for redis
vi.mock("../configs/redis.js", () => {
  return {
    redis: {
      options: { host: "localhost", port: 6379, password: "" },
      get: vi.fn(),
      set: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      incr: vi.fn(),
      ping: vi.fn().mockResolvedValue("PONG"),
      connect: vi.fn().mockResolvedValue(),
    },
    initRedis: vi.fn().mockResolvedValue(),
  };
});

// Global mock for db (prisma) to prevent actual connections in unit tests
vi.mock("../configs/db.js", () => {
  return {
    Genre: {
      ACTION: "ACTION",
      ADVENTURE: "ADVENTURE",
      COMEDY: "COMEDY",
    },
    default: {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      story_Genre: {
        findMany: vi.fn(),
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      // Add other models as needed
    },
  };
});
