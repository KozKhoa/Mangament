"use client";

import ForgotPasswordForm from "@/components/forms/forgot-password";
import OtpInputForm from "@/components/forms/otp-input-form";

import useAuth from "@/contexts/AuthContext";
import authService from "@/services/auth";
import { em } from "framer-motion/client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [enteringOtp, setEnteringOtp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function fetchForgotPassword(email: string) {
    setIsProcessing(true);
    const res = await authService.forgotPassword(email);
    setIsProcessing(false);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setEnteringOtp(true);
  }

  async function fetchResetPassword(email: string, otp: string) {
    setIsProcessing(true);
    const res = await authService.resetPassword(email, otp);
    setIsProcessing(false);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    router.replace("/login");

    toast.message(res.message);
  }

  async function handleRequestOTPCode(email: string) {
    fetchForgotPassword(email);
    setEmail(email);
  }

  async function handleSubmitOTPCode(otp: string) {
    fetchResetPassword(email, otp);
  }

  return (
    <div className="flex justify-center items-center w-full h-[80vh] mb-20">
      {!enteringOtp ? (
        <ForgotPasswordForm onSubmit={(email, event) => handleRequestOTPCode(email)}></ForgotPasswordForm>
      ) : (
        <OtpInputForm onSubmit={handleSubmitOTPCode} onResend={() => handleRequestOTPCode(email)} isProcessing={isProcessing}></OtpInputForm>
      )}
    </div>
  );
}
