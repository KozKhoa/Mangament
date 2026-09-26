import { redis } from "../../configs/redis.js";
import { Worker } from "bullmq";
import mail from "../../configs/mail.js";
import {
  renderOtpEmailTemplate,
  renderNewPasswordEmailTemplate,
  renderUpdateStoryStatusEmailTemplate,
  renderStoryUpdatedNotificationTemplate,
} from "../../src/templates/emailTemplates.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

function getSenderAddress() {
  const email = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return `"Mangament" <${email}>`;
}

function getCoverArtUrl(storyCoverArt) {
  if (!storyCoverArt) return "";
  const path = storyCoverArt.path || storyCoverArt.key || storyCoverArt.url || "";
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.replace(/^\/+/, "");
  return [process.env.CDN_URL || "", cleanPath].filter(Boolean).join("/");
}

const sendOtpEmailWorker = new Worker(
  "send-otp-email",
  async (job) => {
    const { email, otp } = job.data;
    const { subject, html } = renderOtpEmailTemplate({ otp });

    await mail.sendMail({
      from: getSenderAddress(),
      to: email,
      subject,
      html,
    });

    console.log("Send OTP email to", email);
  },
  { connection, concurrency: 1 },
);

const sendNewPasswordEmailWorker = new Worker(
  "send-new-password-email",
  async (job) => {
    const { email, newPassword } = job.data;
    const { subject, html } = renderNewPasswordEmailTemplate({ newPassword });

    await mail.sendMail({
      from: getSenderAddress(),
      to: email,
      subject,
      html,
    });

    console.log("Send new password email to", email);
  },
  { connection, concurrency: 1 },
);

const sendUpdateStoryStatusEmailWorker = new Worker(
  "send-update-story-status",
  async (job) => {
    const { email, storyTitle, storyCoverArt, success, log } = job.data;
    const coverArtUrl = getCoverArtUrl(storyCoverArt);

    const { subject, html } = renderUpdateStoryStatusEmailTemplate({
      storyTitle,
      storyCoverArtUrl: coverArtUrl,
      success,
      log,
    });

    await mail.sendMail({
      from: getSenderAddress(),
      to: email,
      subject,
      html,
    });

    console.log("Send update story status email to", email);
  },
  { connection, concurrency: 1 },
);

const sendNotificationWhenStoryUpdatedWorder = new Worker(
  "send-notification-when-story-updated",
  async (job) => {
    const { email, storyTitle, storyType, storyCoverArt } = job.data;
    const coverArtUrl = getCoverArtUrl(storyCoverArt);

    const { subject, html } = renderStoryUpdatedNotificationTemplate({
      storyTitle,
      storyType,
      storyCoverArtUrl: coverArtUrl,
    });

    await mail.sendMail({
      from: getSenderAddress(),
      to: email,
      subject,
      html,
    });

    console.log(`Send notification when ${storyTitle} updated email to`, email);
  },
  { connection, concurrency: 5 },
);

export default {
  sendOtpEmailWorker,
  sendNewPasswordEmailWorker,
  sendUpdateStoryStatusEmailWorker,
  sendNotificationWhenStoryUpdatedWorder,
};
