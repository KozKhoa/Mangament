import nodemailer from "nodemailer";

const globalForMail = globalThis;

const mail =
  globalForMail.mail ||
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForMail.mail = mail;
}

export default mail;
