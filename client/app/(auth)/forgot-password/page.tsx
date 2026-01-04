"use client";

import ForgotPasswordForm from "@/components/forms/forgot-password";
import OtpInputForm from "@/components/forms/otp-input-form";

import useAuth from "@/contexts/AuthContext";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const router = useRouter();

  const [enteringOtp, setEnteringOtp] = useState(false);

  async function handleSubmitEmail(email: string) {
    console.log(email);
  }

  async function handleSubmitOtp(otp: string) {
    console.log(otp);
  }

  return (
    <div className="flex justify-center items-center w-full h-[80vh] mb-20">
      {!enteringOtp ? (
        <ForgotPasswordForm onSubmit={(email, event) => handleSubmitEmail(email)}></ForgotPasswordForm>
      ) : (
        <OtpInputForm onSubmit={handleSubmitOtp}></OtpInputForm>
      )}
    </div>
  );
}
