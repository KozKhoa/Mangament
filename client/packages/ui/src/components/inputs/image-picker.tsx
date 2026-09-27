import { useEffect, useState } from "react";

import ErrorExclamationIcon from "@/public/error-exclamation.svg";
import ReloadIcon from "@/public/reload.svg";
import TickIcon from "@/public/tick-o.svg";
import UploadPhotoIcon from "@/public/upload/upload-photo.svg";
import Image from "next/image";

export interface ImagePickerProps {
  className?: string;

  defaultValue?: string | File;
  value?: string | File;

  labelForNoImage?: string;

  disabled?: boolean;

  onChange?: (image: string | File) => void;
  onReset?: (image: string | File) => void;

  onSelectMultiImage?: (images: File[]) => void;
}

export default function ImagePicker({
  className,
  defaultValue,
  value,
  labelForNoImage,
  disabled = false,
  onChange,
  onReset,
  onSelectMultiImage,
}: ImagePickerProps) {
  const [image, setImage] = useState<string>();
  const [error, setError] = useState<string>("");

  function handleChangeImage(files?: FileList) {
    if (!files || files?.length < 0) return;

    if (files.length > 1) {
      onSelectMultiImage?.([...files]);
    } else {
      const file = files.item(0);

      if (!file) return;

      if (!file.type.startsWith("image")) {
        setError("File phải là hình ảnh");
        return;
      } else {
        setError("");
      }

      if (image && image.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }

      setImage(URL.createObjectURL(file));

      onChange?.(file);
    }
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

      <label
        className={` ${disabled ? "" : "cursor-pointer"} ${false ? "opacity-70 w-full scale-[0.98] border-2 border-dashed border-blue-500 bg-blue-50/10" : ""} transition-all duration-200 block h-full`}
      >
        <input
          disabled={disabled}
          type="file"
          accept="image/*"
          onChange={(e) => handleChangeImage(e.target.files ?? undefined)}
          multiple
          className="hidden"
        ></input>

        {image ? (
          <Image src={image} alt={image} width={400} height={400} style={{ width: "auto", height: "auto" }} className="rounded-sm shrink-0"></Image>
        ) : (
          <div className="flex flex-col gap-2 justify-center items-center w-full h-full m-auto text-[#7f7f7f]">
            <UploadPhotoIcon className="w-30 h-30 "></UploadPhotoIcon>
            <p className="font-semibold text-lg">{false ? "Thả ảnh vào đây..." : labelForNoImage}</p>
          </div>
        )}
      </label>
    </div>
  );
}
