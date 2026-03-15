import { convertDateTo_yyyMMddHHmm } from "@/utils/convert";
import Comment from "@/types/comment";
import Image from "next/image";

import TrashIcon from "@/public/trash.svg";
import { modal } from "../modal/modal.store";

export default function CommentCard({ comment, className, onDelete }: { comment: Comment; className?: string; onDelete?: () => Promise<any> | any }) {
  function handleDelete() {
    modal.open("confirm", {
      title: "Xác nhận xóa",
      content: (
        <div className="flex flex-col gap-2 w-[80vw]">
          <p className="text-[1.4em] sm:text-[1.6em]">{comment.title}</p>
          <p className="text-foreground/70 text-[0.85em] sm:text-[1em]">{comment.content}</p>
        </div>
      ),
      onCancel: modal.close,
      onConfirm: async () => {
        await onDelete?.();
        modal.close();
      },
    });
  }

  return (
    <div className={`flex flex-col gap-2 justify-between p-4 rounded-md shadow-lg bg-background-items ${className}`}>
      <div className="flex flex-col gap-2 ">
        <p className="text-[1.4em] sm:text-[1.6em]">{comment.title}</p>
        <p className="text-foreground/70 text-[0.85em] sm:text-[1em]">{comment.content}</p>
      </div>

      <div className="flex flex-row flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-row justify-center items-center gap-3">
          <Image
            className="rounded-full"
            src={[process.env.NEXT_PUBLIC_CDN_URL, comment.user?.avatar?.key].join("/") ?? "/avatar.png"}
            alt="Avatar"
            width={32}
            height={32}
          />
          <p className="text-[0.9em] line-clamp-2">{comment.user?.name}</p>
        </div>
        <div className="flex flex-row gap-2">
          <p className="text-foreground/60 text-[0.8em] italic text-end">{convertDateTo_yyyMMddHHmm(new Date(comment.created_at ?? ""))}</p>
          {onDelete && <TrashIcon className="w-5 h-5 text-foreground/80 cursor-pointer" onClick={handleDelete} />}
        </div>
      </div>
    </div>
  );
}
