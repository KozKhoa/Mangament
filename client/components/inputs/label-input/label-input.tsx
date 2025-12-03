"use client";

import { useEffect, useRef, useState } from "react";

import EditIcon from "@/public/edit/edit.svg";
import ConfirmIcon from "@/public/edit/confirm.svg";

export default function LabelInput({
  label,
  placeHolder,
  value,
  onChange,
  inputType,
  disable = false,

  className,
}: {
  label?: string;
  placeHolder?: string;
  value?: any;
  onChange?: (value: any) => void;
  inputType?: "text" | "number" | "date";
  disable?: boolean;

  className?: string;
}) {
  const [isEdited, setIsEdited] = useState<boolean>(false);

  const [inputValue, setInputValue] = useState<any>("");

  function toggleEdit() {
    setIsEdited(!isEdited);

    if (isEdited) onChange?.(inputValue);
  }

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  return (
    <div className={`p-2.5 ${className}`}>
      {/* Label */}
      <p className="text-[0.9em] font-semibold">{label}</p>
      <div className="flex flex-row gap-3 justify-between items-center   w-full border-b px-5 py-0.5">
        <input
          className="w-full outline-none"
          name={label}
          type={inputType ?? "text"}
          placeholder={placeHolder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isEdited}
          autoFocus={isEdited}
        />

        {!disable && (
          <button onClick={toggleEdit} className="w-fit">
            {isEdited ? <ConfirmIcon className="w-6 h-6"></ConfirmIcon> : <EditIcon className="w-6 h-6"></EditIcon>}
          </button>
        )}
      </div>
    </div>
  );
}
