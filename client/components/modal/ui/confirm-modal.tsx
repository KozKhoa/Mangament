import Button from "@/components/buttons/button";
import { useState } from "react";

export default function ConfirmModal({
  title,
  children,
  onCancel,
  onConfirm,
}: {
  title?: string;
  children?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="flex flex-col gap-2 pb-2">
      <p className="text-[1.5em] md:text-[1.8em] font-semibold">{title}</p>

      <div>{children}</div>

      <div className="flex flex-row gap-2 w-full justify-end items-center mt-3">
        <Button
          className="font-semibold"
          isProcessing={isProcessing}
          disable={isProcessing}
          onClick={() => {
            setIsProcessing(true);
            onConfirm?.();
            setIsProcessing(false);
          }}
          buttonType="default"
        >
          Xác nhận
        </Button>
        <Button
          className="font-semibold"
          isProcessing={isProcessing}
          disable={isProcessing}
          onClick={() => {
            setIsProcessing(true);
            onCancel?.();
            setIsProcessing(false);
          }}
          buttonType="delete"
        >
          Hủy bỏ
        </Button>
      </div>
    </div>
  );
}
