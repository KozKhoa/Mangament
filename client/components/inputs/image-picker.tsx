import { ChangeEvent, useEffect, useState } from "react";

import ErrorExclamationIcon from "@/public/error-exclamation.svg";
import ReloadIcon from "@/public/reload.svg";
import TickIcon from "@/public/tick-o.svg";
import UploadPhotoIcon from "@/public/upload/upload-photo.svg";
import Image from "next/image";
import { audio } from "framer-motion/client";

export interface ImagePickerProps {
  className?: string;

  defaultValue?: string | File;
  value?: string | File;

  labelForNoImage?: string;

  disabled?: boolean;

  onChange?: (image: string | File) => void;
  onReset?: (image: string | File) => void;
}

export default function ImagePicker({ className, defaultValue, value, labelForNoImage, disabled = false, onChange, onReset }: ImagePickerProps) {
  const [image, setImage] = useState<string>();
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

    URL.revokeObjectURL(image ?? "");

    setImage(URL.createObjectURL(file));

    onChange?.(file);
  }

  function handleResetImage() {
    setImage(defaultValue ? (typeof defaultValue === "string" ? defaultValue : URL.createObjectURL(defaultValue)) : "");
    onReset?.(defaultValue ?? "");
  }

  useEffect(() => {
    let url = "";
    if (value !== null && value !== undefined) {
      url = typeof value !== "string" ? URL.createObjectURL(value) : "";

      setImage(value ? (typeof value === "string" ? value : url) : "");
    } else if (defaultValue !== null && defaultValue !== undefined) {
      url = typeof defaultValue !== "string" ? URL.createObjectURL(defaultValue) : "";

      setImage(defaultValue ? (typeof defaultValue === "string" ? defaultValue : url) : "");
    }

    return () => URL.revokeObjectURL(url);
  }, [value]);

  return (
    <div className={className}>
      {image && image !== defaultValue && (
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
            <button disabled={disabled} className={`${disabled ? "" : "cursor-pointer hover:animate-spin"}`} onClick={handleResetImage}>
              <ReloadIcon className="w-5 h-5 m-3 fill-foreground "></ReloadIcon>
            </button>
          )}
        </div>
      )}

      <label className={` ${disabled ? "" : "cursor-pointer"}  `}>
        <input disabled={disabled} type="file" accept="image/*" onChange={handleChangeImage} className="hidden"></input>

        {image ? (
          <Image
            src={image}
            alt={image}
            width={10000}
            height={10000}
            style={{ width: "auto", height: "auto" }}
            className="rounded-sm shrink-0"
            unoptimized
          ></Image>
        ) : (
          <div className="flex flex-col gap-2 justify-center items-center w-full h-full m-auto text-[#7f7f7f]">
            <UploadPhotoIcon className="w-30 h-30 "></UploadPhotoIcon>
            <p className="font-semibold text-lg">{labelForNoImage}</p>
          </div>
        )}
      </label>
    </div>
  );
}
