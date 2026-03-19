import { useRef, useState } from "react";

export default function OtpInput({
  className,
  length = 6,
  onChange,
  disableAll = false,
}: {
  className?: string;
  length?: number;
  onChange?: (otp: string[]) => void;
  disableAll?: boolean;
}) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement>>([]);

  function handleChangeOtp(otpIndex: number, value: string) {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[otpIndex] = value;
    setOtp(newOtp);

    if (value && otpIndex < length - 1) {
      inputsRef.current[otpIndex + 1]?.focus();
    }

    onChange?.(newOtp);
  }

  function handleKeyDown(otpIndex: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[otpIndex].current) {
      handleChangeOtp(otpIndex, "");
      if (otpIndex > 0) inputsRef.current[otpIndex - 1]?.focus();
      else if (otpIndex === 0) inputsRef.current[length - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    const newOtp = Array(length).fill("");
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });

    setOtp(newOtp);
    inputsRef.current[pasted.length - 1]?.focus();

    onChange?.(newOtp);
  }

  return (
    <div className={`grid grid-cols-6 gap-2 w-fit text-[1.5em] lg:text-[2em] ${className}`}>
      {otp.map((value, i) => (
        <input
          className={`border border-foreground/30 rounded-sm aspect-square w-[1.8em]  text-center outline-none no-spinner
          focus:-translate-y-1 focus:shadow-[2px_4px_1px_var(--foreground)]/50
        
          ${disableAll ? " opacity-40 " : ""}
          `}
          key={i}
          ref={(el) => {
            if (el) inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChangeOtp(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onBeforeInput={(e) => handleChangeOtp(i, "")}
          onPaste={handlePaste}
          autoFocus={i === 0}
          disabled={disableAll}
        ></input>
      ))}
    </div>
  );
}
