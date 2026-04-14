import { redis } from "../configs/redis.js";
import { Queue } from "bullmq";
import db from "../configs/db.js";

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
  #sendNotificationWhenStoryUpdated = new Queue("send-notification-when-story-updated", { connection });

  addJob_SendOtp(email, otp) {
    this.#sendOtp.add("sendOtpEmail", { email, otp }, ADD_JOB_OPTION);
  }

  addJob_SendNewPassword(email, newPassword) {
    this.#sendNewPassword.add("sendNewPassword", { email, newPassword }, ADD_JOB_OPTION);
  }

  addJob_SendUpdateStoryStatus(email, storyTitle, storyCoverArt, success, log) {
    this.#sendUpdateStoryStatus.add("sendUpdateStoryStatus", { email, storyTitle, storyCoverArt, success, log }, ADD_JOB_OPTION);
  }

  async addJob_SendNotificationToUsersWhenStoryUpdated(storyId) {
    const favourites = await db.favouriteStory.findMany({
      where: { story_id: storyId },
      select: {
        user: { select: { email: true } },
        story: {
          select: { id: true, title: true, type: true, cover_art: { select: { url: true, key: true } } },
        },
      },
    });

    favourites.forEach((fav) => {
      this.#sendNotificationWhenStoryUpdated.add(
        "sendNotificationWhenStoryUpdated",
        {
          email: fav.user.email,
          storyId: fav.story.id,
          storyTitle: fav.story.title,
          storyType: fav.story.type,
          storyCoverArt: fav.story.cover_art,
        },
        ADD_JOB_OPTION,
      );
    });
  }
}

const mailQueue = new MailQueue();
export default mailQueue;
