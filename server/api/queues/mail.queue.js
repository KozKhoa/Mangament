import { redis } from "../configs/redis.js";
import { Queue } from "bullmq";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const ATTEMP = 3;
const DELAY = 5000;

const ADD_JOB_OPTION = { attempts: ATTEMP, backoff: { type: "exponential", delay: DELAY }, removeOnComplete: true, removeOnFail: true };

class MailQueue {
  #sendOtpEmailQueue = new Queue("send-otp-email", { connection });
  #sendNewPasswordEmailQueue = new Queue("send-new-password-email", { connection });

  addJobSendOtp(email, otp) {
    this.#sendOtpEmailQueue.add("sendOtpEmail", { email, otp }, ADD_JOB_OPTION);
  }

  addJobSendNewPassword(email, newPassword) {
    this.#sendNewPasswordEmailQueue.add("sendNewPassword", { email, newPassword }, ADD_JOB_OPTION);
  }
}

const mailQueue = new MailQueue();
export default mailQueue;
