import { useState } from "react";

import ErrorExclamationIcon from "@/public/error-exclamation.svg";
import OpenEyeIcon from "@/public/eye/open.svg";
import CloseEyeIcon from "@/public/eye/close.svg";
import ReloadIcon from "@/public/reload.svg";

interface InputProps {
  onChange?: (text: string) => void;
  onReset?: (text: string) => void;
  label?: string;
  defaultValue?: string;
  value?: string;
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
  defaultValue,
  value,
  placeHolder,
  type = "text",
  onChange,
  onReset,
  showPassword = false,
  className,
  require = false,
  tabIndex,
}: InputProps) {
  const [isShowPassword, setIsShowPassword] = useState<boolean>(showPassword);

  const [text, setText] = useState<string>(defaultValue ?? "");

  const handleChange = (text: string) => {
    setText(text);
    onChange?.(text);
  };

  function handleReset() {
    if (defaultValue === null || defaultValue === undefined) return;

    setText(defaultValue);
    onReset?.(defaultValue);
  }

  return (
    <label className={`flex flex-col gap-1 text-foreground   ${className}`}>
      <div className="flex flex-row flex-wrap items-center justify-between gap-1 px-1">
        <p className="font-semibold">
          {label} {require && <span className="text-red-500">*</span>}
        </p>

        {onReset && <ReloadIcon onClick={handleReset} className="w-5 h-5 fill-foreground cursor-pointer hover:animate-spin"></ReloadIcon>}
      </div>

      {error && (
        <div className="flex gap-2.5 items-center text-error ">
          <ErrorExclamationIcon className="w-[1em] h-[1em]"></ErrorExclamationIcon>
          <p>{error}</p>
        </div>
      )}

      <div
        className={`flex gap-0.5 items-center px-3 py-2 border bg-background-items
          ${error ? "border-error" : "border-foreground/30"} rounded-sm `}
      >
        <input
          className="w-full outline-none"
          type={isShowPassword ? "text" : type}
          placeholder={placeHolder}
          name={name}
          value={value ?? text}
          onChange={(event) => handleChange(event.target.value)}
          tabIndex={tabIndex}
          required={require}
        ></input>
        {type === "password" && (
          <div className="cursor-pointer" onClick={() => setIsShowPassword(!isShowPassword)}>
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
