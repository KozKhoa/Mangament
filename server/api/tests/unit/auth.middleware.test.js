import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthenticationToken, AuthorizationRole, OptionalAuth, verifyApiKey } from "../../src/middlewares/Auth.Middleware.js";
import * as userService from "../../src/services/user.service.js";
import * as tokenUtils from "../../src/utils/Token.js";

// Mock user service and token utils
vi.mock("../../src/services/user.service.js", () => ({
  FindUser: vi.fn(),
}));

vi.mock("../../src/utils/Token.js", () => ({
  VerifyAccessToken: vi.fn(),
}));

describe("Auth Middleware", () => {
  const originalEnv = { ...process.env };
  const mockAdminToken = "mock.admin.jwt.token";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ADMIN_TOKEN = mockAdminToken;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("AuthenticationToken", () => {
    it("should return 401 if authorization header is missing or does not start with Bearer", async () => {
      const req = { headers: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await AuthenticationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Unauthorized access",
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should bypass verification in development when token matches ADMIN_TOKEN", async () => {
      process.env.NODE_ENV = "development";

      const req = {
        headers: {
          authorization: `Bearer ${mockAdminToken}`,
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await AuthenticationToken(req, res, next);

      // Should bypass VerifyAccessToken and FindUser
      expect(tokenUtils.VerifyAccessToken).not.toHaveBeenCalled();
      expect(userService.FindUser).not.toHaveBeenCalled();

      // Should populate req.user and call next()
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe("admin");
      expect(req.user.id).toBe("8d9305f2-5923-46d2-99bd-7e32ea5d7a07");
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should handle single or double quotes around ADMIN_TOKEN in env", async () => {
      process.env.NODE_ENV = "development";
      process.env.ADMIN_TOKEN = `'${mockAdminToken}'`;

      const req = {
        headers: {
          authorization: `Bearer ${mockAdminToken}`,
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await AuthenticationToken(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user.role).toBe("admin");
    });

    it("should NOT bypass verification in production even if token matches ADMIN_TOKEN", async () => {
      process.env.NODE_ENV = "production";

      const req = {
        headers: {
          authorization: `Bearer ${mockAdminToken}`,
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      tokenUtils.VerifyAccessToken.mockReturnValue({
        decodedToken: null,
        isExpire: true,
      });

      await AuthenticationToken(req, res, next);

      // VerifyAccessToken MUST be called in production
      expect(tokenUtils.VerifyAccessToken).toHaveBeenCalledWith(mockAdminToken);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should verify regular tokens normally in development", async () => {
      process.env.NODE_ENV = "development";

      const req = {
        headers: {
          authorization: "Bearer some-regular-token",
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      tokenUtils.VerifyAccessToken.mockReturnValue({
        decodedToken: { id: "user-123" },
        isExpire: false,
      });

      userService.FindUser.mockResolvedValue({
        success: true,
        data: {
          id: "user-123",
          name: "Regular User",
          email: "user@example.com",
          role: "user",
        },
      });

      await AuthenticationToken(req, res, next);

      expect(tokenUtils.VerifyAccessToken).toHaveBeenCalledWith("some-regular-token");
      expect(userService.FindUser).toHaveBeenCalledWith({ id: "user-123" });
      expect(req.user).toEqual({
        id: "user-123",
        name: "Regular User",
        email: "user@example.com",
        role: "user",
      });
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("AuthorizationRole", () => {
    it("should allow access when user role is admin", async () => {
      const req = { user: { role: "admin" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await AuthorizationRole(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 403 when user role is not admin", async () => {
      const req = { user: { role: "user" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await AuthorizationRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("OptionalAuth", () => {
    it("should bypass and set req.user in development when token matches ADMIN_TOKEN", async () => {
      process.env.NODE_ENV = "development";

      const req = {
        headers: {
          authorization: `Bearer ${mockAdminToken}`,
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await OptionalAuth(req, res, next);

      expect(tokenUtils.VerifyAccessToken).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe("admin");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("verifyApiKey", () => {
    it("should bypass apiKey in development mode", async () => {
      process.env.NODE_ENV = "development";

      const req = { headers: {} };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await verifyApiKey(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should check API_KEY in production mode", async () => {
      process.env.NODE_ENV = "production";
      process.env.API_KEY = "secret-key";

      const req = { headers: { "x-api-key": "secret-key" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await verifyApiKey(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
