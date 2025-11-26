import { useRef, useState } from "react";
import { toast } from "sonner";

import StarPicker from "./star-picker";
import ErrorExclamationIcon from "@/public/error-exclamation.svg";

import User from "@/types/user";
import Rating from "@/types/ratings";
import Comment from "@/types/comment";
import path from "path";
import Image from "next/image";
import DisplayStar from "../displays/ratings/display-star";

interface RatingCommentProps {
  type: "rating" | "comment";
  value?: Rating | Comment;
  onChange?: (message: string, star?: number) => void;

  className?: string;
}

export default function RatingCommentInput({ type, value, onChange, className }: RatingCommentProps) {
  const [star, setStar] = useState<number>();
  const [text, setText] = useState<string>();
  const [errMsg, setErrMsg] = useState<string>();

  function handleFinish() {
    console.log(text);

    if (!text || text === "") {
      setErrMsg("Your can not leave it blank");
      return toast.message("Your can not leave it blank");
    }
    onChange?.(text, star);
  }

  return (
    <div className={`w-full h-full flex flex-col gap-1 ${className}`}>
      <div className="flex flex-row items-center justify-between gap-2">
        {/* Star picker */}

        <div className="flex flex-row gap-5 w-fit">
          <div className="flex flex-row gap-2">
            <img className="h-10 aspect-square rounded-full object-cover" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + value?.user?.avatar.url}></img>
            <div>
              <p className="font-semibold">{value?.user?.name}</p>
              <p className="text-[0.9em] italic">{new Date(value?.created_at ?? "").toLocaleDateString()}</p>
            </div>
          </div>

          {type === "rating" && (
            <label className="flex flex-row flex-wrap gap-2 justify-start items-center">
              <p>Đánh giá:</p>
              <StarPicker onChange={setStar} defaultValue={5}></StarPicker>
            </label>
          )}
        </div>

        {/* Finish button */}

        <button onClick={handleFinish} className="text-center px-3 py-2 bg-foreground text-background font-semibold rounded-md">
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
