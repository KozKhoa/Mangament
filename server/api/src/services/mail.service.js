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
}

const mailService = new MailService();

export default mailService;
