import { useEffect, useState } from "react";
import OtpInput from "../inputs/otp-input";
import Input from "../inputs/input";
import Button from "../buttons/button";

import ErrorExclamationIcon from "@/public/error-exclamation.svg";

const COUNTING_TIME = 60;

export default function OtpInputForm({
  onSubmit,
  onResend,
  otpLength = 6,
  isProcessing = false,
}: {
  onSubmit?: (otp: string) => void;
  onResend?: (otp: string) => void;
  otpLength?: number;
  isProcessing?: boolean;
}) {
  const [otp, setOtp] = useState<string[]>([]);

  const [requestingOtp, setRequestingOtp] = useState(true);
  const [resendCounting, setResendCounting] = useState(COUNTING_TIME);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isProcessing === true) return;

    otp.forEach((item) => {
      if (!item) {
        setError("OTP không hợp lệ");
        return;
      }
    });

    onSubmit?.(otp.toString().replaceAll(",", ""));
  }

  async function handleResend() {
    if (requestingOtp) return;

    setRequestingOtp(true);
    onResend?.(otp.toString().replaceAll(",", ""));
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (requestingOtp) {
      interval = setInterval(() => {
        setResendCounting((prev) => {
          if (prev === 0) {
            setRequestingOtp(false);
            setResendCounting(COUNTING_TIME);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [requestingOtp]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-background text-foreground flex flex-col gap-4 justify-center items-center
          w-full max-w-3xl py-8 px-4 lg:p-8 pt-5 border-2 rounded-[5] shadow-[11px_13px_5px_var(--foreground)]/30
          `}
    >
      <h2 className="text-lg lg:text-[1.8em] text-center ">Nhập mã OTP</h2>

      {error && (
        <div className="flex gap-2.5 items-center text-error">
          <ErrorExclamationIcon className="w-[1em] h-[1em]"></ErrorExclamationIcon>
          <p>{error}</p>
        </div>
      )}

      <OtpInput
        onChange={(otp) => {
          setError("");
          setOtp(otp);
        }}
        className="m-auto"
        length={otpLength}
        disableAll={isProcessing}
      ></OtpInput>

      <p onClick={handleResend} className={`text-lg m-auto ${isProcessing || requestingOtp ? " opacity-50" : "cursor-pointer"}`}>
        Không nhận được mã? <span className="underline">Gửi lại</span> {requestingOtp && <span>({resendCounting}s)</span>}
      </p>

      <Button type="submit" tabIndex={3} disable={isProcessing} isProcessing={isProcessing} className="m-auto text-lg lg:text-[1.5em] mt-3">
        Xác nhận
      </Button>
    </form>
  );
}
