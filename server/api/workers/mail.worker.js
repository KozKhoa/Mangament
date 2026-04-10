import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";

import mail from "../configs/mail.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const sendOtpEmailWorker = new Worker(
  "send-otp-email",
  async (job) => {
    const { email, otp } = job.data;

    await mail.sendMail({
      from: `"Mangament" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>OTP Verification</h2>
        <p>Your OTP code is:</p>
        <h1>${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
      `,
    });

    console.log("Send OTP email to", email);
  },
  { connection, concurrency: 1 },
);

const sendNewPasswordEmailWorker = new Worker(
  "send-new-password-email",
  async (job) => {
    const { email, newPassword } = job.data;

    await mail.sendMail({
      from: `"Mangament" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password",
      html: `
        <h2>Forgot Password</h2>
        <p>Your password code is:</p>
        <h1>${newPassword}</h1>
        <p>Please your password!</p>
      `,
    });

    console.log("Send new password email to", email);
  },
  { connection, concurrency: 1 },
);

export default { sendOtpEmailWorker, sendNewPasswordEmailWorker };
