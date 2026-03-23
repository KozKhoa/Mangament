import { useEffect, useState } from "react";

import ErrorExclamationIcon from "@/public/error-exclamation.svg";
import ReloadIcon from "@/public/reload.svg";

interface TextAreaProps {
  onChange?: (text: string) => void;
  onReset?: (text: string) => void;
  label?: string;
  defaultValue?: string;
  error?: string | null;
  name?: string;
  placeHolder?: string;

  className?: string;
  require?: boolean;
  tabIndex?: number;
}

export default function TextArea({ label, error, name, defaultValue, placeHolder, onChange, onReset, className, require = false, tabIndex }: TextAreaProps) {
  const [value, setValue] = useState<string>(defaultValue ?? "");

  const handleChange = (text: string) => {
    setValue(text);
    onChange?.(text);
  };

  function handleReset() {
    if (defaultValue) {
      setValue(defaultValue);
      onReset?.(defaultValue);
    }
  }

  useEffect(() => {
    if (defaultValue) setValue(defaultValue);
  }, [defaultValue]);

  return (
    <label className={`flex flex-col gap-1 text-foreground  ${className}`}>
      <div className="flex flex-row flex-wrap items-center justify-between gap-1 px-1">
        <p className="font-semibold">{label}</p>

        {onReset && <ReloadIcon onClick={handleReset} className="w-5 h-5 fill-foreground cursor-pointer hover:animate-spin"></ReloadIcon>}
      </div>

      {error && (
        <div className="flex gap-2.5 items-center text-error ">
          <ErrorExclamationIcon className="w-[1em] h-[1em]"></ErrorExclamationIcon>
          <p>{error}</p>
        </div>
      )}

      <div className={`flex gap-0.5 items-center border bg-background-items ${error ? "border-error" : "border-foreground/30"} rounded-sm `}>
        <textarea
          className="w-full outline-none bg-none px-3 py-2"
          placeholder={placeHolder}
          name={name}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          tabIndex={tabIndex}
          required={require}
        ></textarea>
      </div>
    </label>
  );
}
