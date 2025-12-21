import Comment from "@/types/comment";

interface CommentBoxProps {
  comment?: Comment;

  className?: string;
}

export default function CommentBox({ comment, className }: CommentBoxProps) {
  return (
    <div className={`w-full h-full flex flex-col gap-2 ${className}`}>
      <div className="flex flex-row gap-2 justify-start items-center">
        <img className="h-10 aspect-square rounded-full object-cover" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + comment?.user?.avatar?.url}></img>
        <div className="flex flex-col">
          <p className="font-bold">{comment?.user?.name}</p>
          <p className="text[0.8em] italic">{new Date(comment?.created_at ?? "").toLocaleDateString()}</p>
        </div>
      </div>

      {/* Text box */}
      <p className="w-full h-full min-h-10 outline-none p-2 border-2 border-foreground rounded-md">{comment?.message}</p>
    </div>
  );
}
