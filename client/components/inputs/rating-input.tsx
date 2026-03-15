import { useRef, useState } from "react";
import { toast } from "sonner";

import StarPicker from "./star-picker";
import ErrorExclamationIcon from "@/public/error-exclamation.svg";

interface RatingInputProps {
  onFinish?: (message: string, star: number) => void;

  className?: string;
}

export default function RatingInput({ onFinish, className }: RatingInputProps) {
  const [star, setStar] = useState<number>(5);
  const [text, setText] = useState<string>("");
  const [errMsg, setErrMsg] = useState<string>();

  function handleFinish() {
    if (!text || text === "") {
      setErrMsg("Your can not leave it blank");
      return toast.message("Your can not leave it blank");
    }
    onFinish?.(text, star);
  }

  return (
    <div className={`w-full h-full flex flex-col gap-1 ${className}`}>
      <div className="flex flex-row items-center justify-between gap-2">
        {/* Star picker */}
        <div className="flex flex-row gap-5 w-fit">
          <label className="flex flex-row flex-wrap gap-2 justify-start items-center">
            <p>Đánh giá:</p>
            <StarPicker onChange={setStar} defaultValue={5} maxStar={5}></StarPicker>
          </label>
        </div>

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
          placeholder="Nhập đánh giá của bạn về bộ truyện này"
        ></textarea>
      </div>
    </div>
  );
}
