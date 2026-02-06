import { convertDateTo_yyyMMddHHmm } from "@/utils/convert";
import Comment from "@/types/comment";

export default function CommentCard({ comment, className }: { comment: Comment; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 justify-between p-4 rounded-md shadow-lg bg-background-items ${className}`}>
      <div className="flex flex-col gap-2 ">
        <p className="text-[1.4em] sm:text-[1.6em]">{comment.title}</p>
        <p className="text-foreground/70 text-[0.85em] sm:text-[1em]">{comment.content}</p>
      </div>

      <div className="flex flex-row flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-row justify-center items-center gap-3">
          <img className="rounded-full w-8 aspect-square" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + comment.user?.avatar?.url} alt="Avatar"></img>
          <p className="text-[0.9em] line-clamp-2">{comment.user?.name}</p>
        </div>
        <p className="text-foreground/60 text-[0.8em] italic text-end">{convertDateTo_yyyMMddHHmm(new Date(comment.created_at ?? ""))}</p>
      </div>
    </div>
  );
}
