import useAuth from "@/contexts/AuthContext";
import ratingService from "@/services/rating";
import { useState } from "react";
import { toast } from "sonner";
import Input from "../inputs/input";
import StarPicker from "../inputs/star-picker";
import Button from "../buttons/button";
import commentService from "@/services/comment";
import Comment from "@/types/comment";

export interface CommentInputForm {
  onSubmit?: (newComment?: Comment) => void;
  onCancel?: () => void;
  storyId: string;
  storyNodeId?: string;
  className?: string;
}

export default function CommentInputForm({ storyId, storyNodeId, className, onSubmit, onCancel }: CommentInputForm) {
  const [isProcessing, setIsProcessing] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handlePostNewComment() {
    if (!title || !content) return toast.warning("Vui lòng điền đầy đủ nội dung");

    if (title.length > 100) return toast.warning("Chủ đề không được quá 100 chữ");

    setIsProcessing(true);
    let res;
    if (storyNodeId) {
      res = await commentService.postStoryNodeComment(storyId, storyNodeId, title, content);
    } else {
      res = await commentService.postStoryComment(storyId, title, content);
    }
    setIsProcessing(false);

    if (!res.success) return toast.warning(res.message);

    onSubmit?.(res.data);

    toast.message("Bình luận của bạn đã được ghi nhận!");
  }

  return (
    <div className={`flex flex-col gap-2 min-w-[80vw] w-full ${className}`}>
      <h2>Bình luận</h2>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-lg">
          Chủ để bình luận <span className="text-red-400">*</span> <span className="font-normal text-[0.8em]">({title.length})</span>
        </p>
        <textarea
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="w-full h-full min-h-10 outline-none p-2 border border-foreground/40 rounded-md focus:border-foreground focus:shadow-md"
          placeholder="Chủ để (câu hỏi) chính của bình luận (Tối đa 100 chữ)"
        ></textarea>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-lg">
          Bình luận chi tiết <span className="text-red-400">*</span> <span className="font-normal text-[0.8em]">({content.length})</span>
        </p>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
          }}
          className="w-full h-full min-h-32 outline-none p-2 border border-foreground/40 rounded-md focus:border-foreground focus:shadow-md"
          placeholder="Chi tiết bình luận của bạn"
        ></textarea>
      </div>

      <div className="flex flex-row gap-2 justify-center md:justify-end items-center">
        <Button buttonType="default" isProcessing={isProcessing} disable={isProcessing} onClick={handlePostNewComment}>
          Xác nhận
        </Button>
        <Button isProcessing={isProcessing} disable={isProcessing} onClick={onCancel} buttonType="delete">
          Hủy bỏ
        </Button>
      </div>
    </div>
  );
}
