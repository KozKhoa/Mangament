import nodemailer from "nodemailer";

const globalForMail = globalThis;

/**
 * Khởi tạo Transporter gửi email:
 * 1. Nếu có SENDGRID_API_KEY: Tự động kết nối qua SendGrid SMTP Relay (smtp.sendgrid.net:587)
 * 2. Nếu có SMTP_HOST & SMTP_USER & SMTP_PASS: Dùng Custom SMTP Server (AWS SES, Mailgun, Brevo,...)
 * 3. Mặc định fallback: Gmail Service với EMAIL_USER và EMAIL_APP_PASSWORD
 */
export function createMailTransporter() {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // STARTTLS
      auth: {
        user: "apikey", // Chuỗi cố định 'apikey' của SendGrid
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

const mail = globalForMail.mail || createMailTransporter();

if (process.env.NODE_ENV !== "production") {
  globalForMail.mail = mail;
}

export default mail;
