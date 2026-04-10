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
  #sendOtp = new Queue("send-otp-email", { connection });
  #sendNewPassword = new Queue("send-new-password-email", { connection });
  #sendUpdateStoryStatus = new Queue("send-update-story-status", { connection });

  addJob_SendOtp(email, otp) {
    this.#sendOtp.add("sendOtpEmail", { email, otp }, ADD_JOB_OPTION);
  }

  addJob_SendNewPassword(email, newPassword) {
    this.#sendNewPassword.add("sendNewPassword", { email, newPassword }, ADD_JOB_OPTION);
  }

  addJob_SendUpdateStoryStatus(email, storyTitle, storyCoverArt, success, log) {
    this.#sendUpdateStoryStatus.add("sendUpdateStoryStatus", { email, storyTitle, storyCoverArt, success, log }, ADD_JOB_OPTION);
  }
}

const mailQueue = new MailQueue();
export default mailQueue;
