import { useRef, useState } from "react";
import { toast } from "sonner";

import StarPicker from "./star-picker";
import ErrorExclamationIcon from "@/public/error-exclamation.svg";
import { Stardos_Stencil } from "next/font/google";

interface CommentInputProps {
  onFinish?: (message: string) => void;

  className?: string;
}

export default function CommentInput({ onFinish, className }: CommentInputProps) {
  const [text, setText] = useState<string>("");
  const [errMsg, setErrMsg] = useState<string>();

  function handleFinish() {
    console.log(text);

    if (!text || text === "") {
      setErrMsg("Your can not leave it blank");
      return toast.message("Your can not leave it blank");
    }
    onFinish?.(text);
    setText("");
  }

  return (
    <div className={`w-full h-full flex flex-col gap-1 ${className}`}>
      <div className="flex flex-row items-center justify-between gap-2">
        {/* Finish button */}
        <button onClick={handleFinish} className="text-center px-3 py-2 bg-foreground text-background-items font-semibold rounded-md">
          Hoàn tất
        </button>
      </div>

      {/* Input box */}

      <div className="flex flex-col gap-1">
        {/* Error */}
        {errMsg && (
          <div className="flex flex-row gap-2 items-center w-fit text-error">
            <ErrorExclamationIcon className="w-[1.2em] h-[1.2em]"></ErrorExclamationIcon>
            <p>{errMsg}</p>
          </div>
        )}

        {/* Input box */}
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setErrMsg("");
          }}
          className="w-full h-full min-h-10 outline-none p-2 border-2 border-foreground rounded-md"
          placeholder="Nhập bình luận của bạn về bộ truyện này"
        ></textarea>
      </div>
    </div>
  );
}
