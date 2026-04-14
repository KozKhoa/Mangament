import mailQueue from "../../queues/mail.queue.js";

class MailService {
  sendOtpEmail(email, otp) {
    mailQueue.addJob_SendOtp(email, otp);
  }

  sendPasswordEmail(email, password) {
    mailQueue.addJob_SendNewPassword(email, password);
  }

  sendUpdateStoryStatus(email, storyTitle, storyCoverArt, success, log) {
    mailQueue.addJob_SendUpdateStoryStatus(email, storyTitle, storyCoverArt, success, log);
  }

  // This is used to send email to users who have added story into their favourite story
  sendNotificationToUsersWhenStoryUpdated(storyId) {
    mailQueue.addJob_SendNotificationToUsersWhenStoryUpdated(storyId);
  }
}

const mailService = new MailService();

export default mailService;
