import useAuth from "@/contexts/AuthContext";
import ratingService from "@/services/rating";
import { useState } from "react";
import { toast } from "sonner";
import Input from "./input";
import StarPicker from "../inputs/star-picker";
import Button from "../buttons/button";

export interface RatingInputFromProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  storyId: string;
  className?: string;
}

export default function RatingInputForm({ storyId, className, onSubmit, onCancel }: RatingInputFromProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const [star, setStar] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handlePostNewRating() {
    if (!star || !title || !content) return toast.warning("Vui lòng điền đầy đủ nội dung");

    if (title.length > 100) return toast.warning("Cái nhìn tổng quan không được quá 100 chữ");

    setIsProcessing(true);
    const res = await ratingService.addNewRating(storyId, star, title, content);

    setIsProcessing(false);

    if (!res.success) return toast.warning(res.message);

    onSubmit?.();

    toast.message("Đánh giá thành công! Tải lại trang để nhìn thấy đánh giá của bạn");
  }

  return (
    <div className="flex flex-col gap-2 min-w-[80vw] w-full">
      <h2>Đánh giá</h2>

      <div className="flex flex-col gap-1">
        <p className="font-semibold text-lg">
          Số sao <span className="text-red-400">*</span>
        </p>
        <div className="flex flex-row gap-2 ">
          <StarPicker className="w-fit" defaultValue={5} onChange={setStar}></StarPicker>
          <p>{star}</p>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-lg">
          Cái nhìn tổng quan <span className="text-red-400">*</span> <span className="font-normal text-[0.8em]">({title.length})</span>
        </p>
        <textarea
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="w-full h-full min-h-10 outline-none p-2 border border-foreground/40 rounded-md focus:border-foreground focus:shadow-md"
          placeholder="Cái nhìn tổng quan của bạn về bộ truyện này (Tối đa 100 chữ)"
        ></textarea>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-lg">
          Đánh giá chi tiết <span className="text-red-400">*</span> <span className="font-normal text-[0.8em]">({content.length})</span>
        </p>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
          }}
          className="w-full h-full min-h-32 outline-none p-2 border border-foreground/40 rounded-md focus:border-foreground focus:shadow-md"
          placeholder="Đánh giá chi tiết của bạn về bộ truyện này"
        ></textarea>
      </div>

      <div className="flex flex-row gap-2 justify-center md:justify-end items-center">
        <Button isProcessing={isProcessing} disable={isProcessing} onClick={handlePostNewRating} buttonType="default">
          Xác nhận
        </Button>
        <Button isProcessing={isProcessing} disable={isProcessing} onClick={onCancel} buttonType="delete">
          Hủy bỏ
        </Button>
      </div>
    </div>
  );
}
