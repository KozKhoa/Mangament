import Button from "@/components/buttons/button";
import { useState } from "react";

export default function ConfirmModal({
  title,
  children,
  onCancel,
  onConfirm,
}: {
  title?: string;
  children?: React.ReactNode | React.ReactNode[] | string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="flex flex-col gap-2 pb-2">
      <p className="text-[1.2em] md:text-[1.4em] font-semibold">{title}</p>

      <div>{children}</div>

      <div className="flex flex-row gap-2 w-full justify-end items-center mt-3">
        <Button
          buttonType="default"
          className="font-semibold"
          isProcessing={isProcessing}
          disable={isProcessing}
          onClick={async () => {
            setIsProcessing(true);
            await onConfirm?.();
            setIsProcessing(false);
          }}
        >
          Xác nhận
        </Button>
        <Button
          className="font-semibold"
          isProcessing={isProcessing}
          disable={isProcessing}
          onClick={async () => {
            setIsProcessing(true);
            await onCancel?.();
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
