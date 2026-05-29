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

const sendUpdateStoryStatusEmailWorker = new Worker(
  "send-update-story-status",
  async (job) => {
    const { email, storyTitle, storyCoverArt, success, log } = job.data;

    await mail.sendMail({
      from: `"Mangament" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Update Story Status",
      html: `
        <h2>Update Story Status</h2>
        <img src="${[process.env.CDN_URL, storyCoverArt.key].join("/")}" alt="${storyTitle}"/>
        <h2>${storyTitle}</h2>
        <h3>${success ? "Succeeded" : "Failed"}</h3>
        <p>Log: <p>
        <pre style="
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 13px;
          line-height: 1.5;
          overflow-x: auto;
        ">
          ${log}
        </pre>

      `,
    });

    console.log("Send update story status email to", email);
  },
  { connection, concurrency: 1 },
);

const sendNotificationWhenStoryUpdatedWorder = new Worker(
  "send-notification-when-story-updated",
  async (job) => {
    const { email, storyTitle, storyType, storyCoverArt } = job.data;

    await mail.sendMail({
      from: `"Mangament" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${storyTitle} has been updated!`,
      html: `
        <h2>${storyTitle} has been updated!</h2>
        <img src="${[process.env.CDN_URL, storyCoverArt.key].join("/")}" alt="${storyTitle}"/>
        <p>Come here and findout more!</p>
        <a href="${[process.env.CLIENT_URL, "stories", storyType, storyTitle].join("/")}"><h2>View Story</h2></a>
      `,
    });

    console.log(`Send notification when ${storyTitle} updated email to`, email);
  },
  { connection, concurrency: 5 },
);

export default { sendOtpEmailWorker, sendNewPasswordEmailWorker, sendUpdateStoryStatusEmailWorker, sendNotificationWhenStoryUpdatedWorder };
