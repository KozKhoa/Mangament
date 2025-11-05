import { useState } from "react";

import ErrorExclamationIcon from "@/public/error-exclamation.svg";
import OpenEyeIcon from "@/public/eye/open.svg";
import CloseEyeIcon from "@/public/eye/close.svg";

interface InputProps {
  onChange?: (text: string) => void;
  label?: string;
  error?: string | null;
  name?: string;
  placeHolder?: string;
  type?: string;
  showPassword?: boolean; // only work if type is password
  className?: string;
  require?: boolean;
  tabIndex?: number;
}

export default function Input({
  label,
  error,
  name,
  placeHolder,
  type = "text",
  onChange,
  showPassword = false,
  className,
  require = false,
  tabIndex,
}: InputProps) {
  const [isShowPassword, setIsShowPassword] = useState<boolean>(showPassword);
  const handleChange = (text: string) => {
    onChange?.(text);
  };
  return (
    <label
      className={`flex flex-col gap-1 text-foreground font-afacad ${className}`}
    >
      <p className="text-[1.2em] block">{label}</p>

      {error && (
        <div className="flex gap-2.5 items-center text-error ">
          <ErrorExclamationIcon className="w-[1em] h-[1em]"></ErrorExclamationIcon>
          <p>{error}</p>
        </div>
      )}

      <div
        className={`flex gap-0.5 items-center px-3 py-2 border ${
          error ? "border-error" : "border-foreground"
        } rounded-[5] `}
      >
        <input
          className="w-full outline-none bg-none"
          type={isShowPassword ? "text" : type}
          placeholder={placeHolder}
          name={name}
          onChange={(event) => handleChange(event.target.value)}
          tabIndex={tabIndex}
          required={require}
        ></input>
        {type === "password" && (
          <div
            className="cursor-pointer"
            onClick={() => setIsShowPassword(!isShowPassword)}
          >
            {isShowPassword ? (
              <OpenEyeIcon className="w-[1.5em] h-[1.5em] stroke-foreground"></OpenEyeIcon>
            ) : (
              <CloseEyeIcon className="w-[1.5em] h-[1.5em] stroke-foreground"></CloseEyeIcon>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
