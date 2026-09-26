"use client";

import Cropper, { Area } from "react-easy-crop";
import { useState } from "react";

export default function AvatarCropper({ url, onChange, cropShape = "rect" }: { url: string; onChange?: (image: Blob) => void; cropShape?: "round" | "rect" }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx?.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            throw new Error("Failed to create blob from canvas");
          }
        }, "image/jpeg");
      };
    });
  }

  async function onCropComplete(croppedArea: Area, croppedAreaPixels: Area) {
    onChange?.(await getCroppedImg(url, croppedAreaPixels));
  }

  return (
    <div className="relative w-full h-full">
      <Cropper
        image={url}
        cropShape={cropShape}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
      />
    </div>
  );
}
