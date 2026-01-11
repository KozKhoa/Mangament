import * as crypto from "crypto";
import bcrypt from "bcrypt";
import { redis } from "../configs/redis.js";

const OTP_EXPIRATION_TIME = 5 * 60; // 5 minutes
const MAX_RETRY_COUNT = 5;
const SHORT_COOLDOWN_TIME = 60;
const LONG_COOLDOWN_TIME = 60 * 60;

export function generateOtp(email) {
  const otp = crypto.randomInt(100000, 1000000); // Ensure it's a 6-digit number
  applyCooldown(email, SHORT_COOLDOWN_TIME);
  return otp;
}

export async function saveOtp(email, otp) {
  const hashedOtp = await bcrypt.hash(otp, await bcrypt.genSalt(10));

  await redis.set(`otp:${email}`, hashedOtp, "EX", OTP_EXPIRATION_TIME);
  await redis.set(`otp_retry:${email}`, 0, "EX", OTP_EXPIRATION_TIME);
}

export async function verifyOtp(email, otp) {
  // Check user retry count
  const retry = Number(await redis.get(`otp_retry:${email}`)) || 0;

  if (retry >= MAX_RETRY_COUNT) {
    return { success: false, message: "Maximum retry attempts reached" };
  }

  const hashedSaveOtp = await redis.get(`otp:${email}`);

  if (hashedSaveOtp) {
    const compare = await bcrypt.compare(otp, hashedSaveOtp);
    if (compare) {
      return { success: true, message: "Verify token successfull" };
    } else {
      await redis.incr(`otp_retry:${email}`);
    }
  }
  return { success: false, message: "Invalid OTP" };
}

export async function applyCooldown(email, cooldownTime) {
  const currentTime = Math.floor(Date.now() / 1000);
  await redis.set(`otp_cooldown:${email}`, currentTime + cooldownTime, "EX", cooldownTime);
}

export async function cooldownTimeLeft(email) {
  const currentTime = Math.floor(Date.now() / 1000);

  const cooldownTime = await redis.get(`otp_cooldown:${email}`);

  if (cooldownTime && currentTime < Number(cooldownTime)) {
    const timeLeft = Number(cooldownTime) - currentTime;
    return timeLeft;
  }
  return 0;
}
