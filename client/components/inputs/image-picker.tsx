import { ChangeEvent, useEffect, useState } from "react";

import ErrorExclamationIcon from "@/public/error-exclamation.svg";
import ReloadIcon from "@/public/reload.svg";
import TickIcon from "@/public/tick-o.svg";

export interface ImagePickeProps {
  className?: string;

  defaultValue?: string;

  onChange?: (image: File) => void;
  onReset?: (image: string) => void;
}

export default function ImagePicker({ className, defaultValue, onChange, onReset }: ImagePickeProps) {
  const [image, setImage] = useState<string>(defaultValue ?? "");
  const [error, setError] = useState<string>("");

  function handleChangeImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file?.type.startsWith("image")) {
      setError("File phải là hình ảnh");
      return;
    } else {
      setError("");
    }

    setImage(URL.createObjectURL(file));

    onChange?.(file);
  }

  function handleResetImage() {
    setImage(defaultValue ?? "");
    onReset?.(defaultValue ?? "");
  }

  useEffect(() => {
    setImage(defaultValue ?? "");
  }, [defaultValue]);

  return (
    <div>
      {image !== defaultValue && (
        <div className="flex flex-row gap-2 justify-between mb-1">
          {/* Error */}
          {error ? (
            <div className="flex gap-2.5 items-center text-error ">
              <ErrorExclamationIcon className="w-[1em] h-[1em]"></ErrorExclamationIcon>
              <p>{error}</p>
            </div>
          ) : (
            <div className="flex gap-2.5 items-center text-green-600 ">
              <TickIcon className="w-[1em] h-[1em]"></TickIcon>
              <p>Ảnh hợp lệ</p>
            </div>
          )}

          {onReset && image !== defaultValue && (
            <button className="" onClick={handleResetImage}>
              <ReloadIcon className="w-5 h-5 m-3 fill-foreground cursor-pointer hover:animate-spin"></ReloadIcon>
            </button>
          )}
        </div>
      )}

      <label className={` ${className}`}>
        <input type="file" accept="image/*" onChange={handleChangeImage} className="hidden"></input>

        {image && (
          <div className="relative cursor-pointer">
            <img src={image} className="rounded-sm"></img>
          </div>
        )}
      </label>
    </div>
  );
}
