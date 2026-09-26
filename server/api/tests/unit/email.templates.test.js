import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  baseEmailLayout,
  renderOtpEmailTemplate,
  renderNewPasswordEmailTemplate,
  renderUpdateStoryStatusEmailTemplate,
  renderStoryUpdatedNotificationTemplate,
  renderWelcomeEmailTemplate,
  renderSecurityAlertEmailTemplate,
} from "../../src/templates/emailTemplates.js";
import { createMailTransporter } from "../../configs/mail.js";
import nodemailer from "nodemailer";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockImplementation((config) => ({
      _config: config,
      sendMail: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    })),
  },
}));

describe("Email Templates & Mail Transporter Config", () => {
  describe("createMailTransporter", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("should use SendGrid SMTP relay when SENDGRID_API_KEY is present", () => {
      process.env.SENDGRID_API_KEY = "SG.mock_test_key_123";
      delete process.env.SMTP_HOST;

      createMailTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: "SG.mock_test_key_123",
          },
        }),
      );
    });

    it("should use Custom SMTP when SMTP_HOST, USER, and PASS are set without SendGrid", () => {
      delete process.env.SENDGRID_API_KEY;
      process.env.SMTP_HOST = "smtp.mailgun.org";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "postmaster@mangament.com";
      process.env.SMTP_PASS = "secret_pass";

      createMailTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.mailgun.org",
          port: 465,
          secure: true,
          auth: {
            user: "postmaster@mangament.com",
            pass: "secret_pass",
          },
        }),
      );
    });

    it("should fallback to Gmail when no SendGrid or Custom SMTP configured", () => {
      delete process.env.SENDGRID_API_KEY;
      delete process.env.SMTP_HOST;
      process.env.EMAIL_USER = "admin@gmail.com";
      process.env.EMAIL_APP_PASSWORD = "app_password";

      createMailTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          service: "gmail",
          auth: {
            user: "admin@gmail.com",
            pass: "app_password",
          },
        }),
      );
    });
  });

  describe("baseEmailLayout", () => {
    it("should render layout with title and footer", () => {
      const html = baseEmailLayout({
        title: "Test Layout",
        previewText: "Preview snippet",
        content: "<p>Main Content</p>",
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("MANGAMENT");
      expect(html).toContain("<p>Main Content</p>");
      expect(html).toContain("Preview snippet");
      expect(html).toContain("Tất cả các quyền được bảo lưu.");
    });
  });

  describe("renderOtpEmailTemplate", () => {
    it("should render OTP email with code and expiration time", () => {
      const { subject, html } = renderOtpEmailTemplate({ otp: "987654", expiresInMinutes: 10 });

      expect(subject).toBe("[Mangament] Mã xác thực OTP của bạn: 987654");
      expect(html).toContain("987654");
      expect(html).toContain("10 phút");
      expect(html).toContain("Lưu ý bảo mật");
    });
  });

  describe("renderNewPasswordEmailTemplate", () => {
    it("should render new password email with login link", () => {
      const { subject, html } = renderNewPasswordEmailTemplate({
        newPassword: "RandomNewPassword#2026",
        clientUrl: "https://mangament.com",
      });

      expect(subject).toBe("[Mangament] Mật khẩu mới cho tài khoản của bạn");
      expect(html).toContain("RandomNewPassword#2026");
      expect(html).toContain("https://mangament.com/login");
      expect(html).toContain("Đăng nhập ngay");
    });
  });

  describe("renderUpdateStoryStatusEmailTemplate", () => {
    it("should render success status with log and cover art", () => {
      const { subject, html } = renderUpdateStoryStatusEmailTemplate({
        storyTitle: "One Piece",
        storyCoverArtUrl: "https://cdn.mangament.com/cover.jpg",
        success: true,
        log: "All nodes synchronized successfully.",
      });

      expect(subject).toContain("Thành công");
      expect(html).toContain("CẬP NHẬT THÀNH CÔNG");
      expect(html).toContain("One Piece");
      expect(html).toContain("https://cdn.mangament.com/cover.jpg");
      expect(html).toContain("All nodes synchronized successfully.");
    });

    it("should render failure status when success is false", () => {
      const { subject, html } = renderUpdateStoryStatusEmailTemplate({
        storyTitle: "Naruto",
        success: false,
        log: "Database timeout error",
      });

      expect(subject).toContain("Thất bại");
      expect(html).toContain("CẬP NHẬT THẤT BẠI");
      expect(html).toContain("Database timeout error");
    });
  });

  describe("renderStoryUpdatedNotificationTemplate", () => {
    it("should render reader notification with CTA button", () => {
      const { subject, html } = renderStoryUpdatedNotificationTemplate({
        storyTitle: "Chainsaw Man",
        storyType: "manga",
        storyCoverArtUrl: "https://cdn.mangament.com/csm.jpg",
      });

      expect(subject).toContain("Chainsaw Man");
      expect(subject).toContain("chương mới");
      expect(html).toContain("Chainsaw Man");
      expect(html).toContain("ĐỌC NGAY BÂY GIỜ");
      expect(html).toContain("https://cdn.mangament.com/csm.jpg");
    });
  });

  describe("renderWelcomeEmailTemplate", () => {
    it("should render welcome email with member name", () => {
      const { subject, html } = renderWelcomeEmailTemplate({
        userName: "Alex",
        clientUrl: "https://mangament.com",
      });

      expect(subject).toContain("Alex");
      expect(html).toContain("Chào mừng Alex");
      expect(html).toContain("Tủ truyện thông minh");
      expect(html).toContain("Bắt đầu khám phá ngay");
    });
  });

  describe("renderSecurityAlertEmailTemplate", () => {
    it("should render security alert with IP, device, and time", () => {
      const { subject, html } = renderSecurityAlertEmailTemplate({
        userName: "Khoa",
        action: "Đăng nhập từ vị trí mới",
        ipAddress: "192.168.1.100",
        userAgent: "Chrome trên Linux",
      });

      expect(subject).toContain("Cảnh báo bảo mật");
      expect(html).toContain("Khoa");
      expect(html).toContain("Đăng nhập từ vị trí mới");
      expect(html).toContain("192.168.1.100");
      expect(html).toContain("Chrome trên Linux");
      expect(html).toContain("Bảo vệ tài khoản ngay");
    });
  });
});
