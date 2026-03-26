import { redis } from "../configs/redis.js";

import { Queue, Worker } from "bullmq";
import * as storyModel from "../services/story.service.js";
import mailService from "../services/mail.service.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const ATTEMP = 3;
const DELAY = 5000;

const ADD_JOB_OPTION = { attempts: ATTEMP, backoff: { type: "exponential", delay: DELAY }, removeOnComplete: true, removeOnFail: true };

const sendOtpEmailQueue = new Queue("send-otp-email", { connection });
const sendOtpEmailWorker = new Worker(
  "send-otp-email",
  async (job) => {
    const { email, otp } = job.data;
    await mailService.sendOtpEmail(email, otp);
  },
  { connection, concurrency: 1 },
);

export function AddJobSendOtp(email, otp) {
  sendOtpEmailQueue.add("sendOtpEmail", { email, otp }, ADD_JOB_OPTION);
}

const sendNewPasswordEmailQueue = new Queue("send-new-password-email", { connection });
const sendNewPasswordEmailWorker = new Worker(
  "send-new-password-email",
  async (job) => {
    const { email, newPassword } = job.data;
    await mailService.sendPasswordEmail(email, newPassword);
  },
  { connection, concurrency: 1 },
);

export function AddJobSendNewPassword(email, newPassword) {
  sendNewPasswordEmailQueue.add("sendNewPassword", { email, newPassword }, ADD_JOB_OPTION);
}
