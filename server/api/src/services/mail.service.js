import mail from "../configs/mail.js";

class MailService {
  async sendOtpEmail(email, otp) {
    const sendEmail = await mail.sendMail({
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
  }

  async sendPasswordEmail(email, password) {
    await mail.sendMail({
      from: `"Mangament" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password",
      html: `
      <h2>Forgot Password</h2>
      <p>Your password code is:</p>
      <h1>${password}</h1>
      <p>Please your password!</p>
    `,
    });
  }
}

const mailService = new MailService();

export default mailService;
