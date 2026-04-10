import mailQueue from "../../queues/mail.queue.js";

class MailService {
  async sendOtpEmail(email, otp) {
    mailQueue.addJobSendOtp(email, otp);
  }

  async sendPasswordEmail(email, password) {
    mailQueue.addJobSendNewPassword(email, password);
  }
}

const mailService = new MailService();

export default mailService;
