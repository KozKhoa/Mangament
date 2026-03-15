import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import MasonryGrid from "./masonry-grid";
import Loading from "../loadings/loading";
import CommentCard from "../cards/comment-card";
import CommentInputForm from "../forms/comment-input-form";

import commentService from "@/services/comment";

import Comment from "@/types/comment";
import { Pagination } from "@/types/pagination";
import { modal } from "../modal/modal.store";
import useAuth from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

interface StoryNodeCommentsGridProps {
  className?: string;
  storyNodeId?: string;
  storyId: string;
  elementPerPage?: number;
}

const SWITCH_LAYOUT = 4;

function CommentButton({ storyId, storyNodeId, onSubmit }: { storyId: string; storyNodeId?: string; onSubmit?: (newComment?: Comment) => void }) {
  return (
    <button
      onClick={() => {
        modal.open("custom", {
          content: (
            <CommentInputForm
              onCancel={modal.close}
              onSubmit={(newComment) => {
                onSubmit?.(newComment);
                modal.close();
              }}
              storyId={storyId}
              storyNodeId={storyNodeId}
            ></CommentInputForm>
          ),
        });
      }}
      className="px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 cursor-pointer hover:bg-foreground/20"
    >
      Bình luận ➤
    </button>
  );
}

export default function CommentMasonryGrid({ className, storyNodeId, storyId, elementPerPage = 8 }: StoryNodeCommentsGridProps) {
  const auth = useAuth();
  const user = auth?.user;

  const page = useRef(1);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<Pagination>();
  const [loading, setLoading] = useState(true);

  async function fetchMoreStoryComments() {
    if (!storyId) return;

    setLoading(true);
    const res = await commentService.getStoryComments(storyId, { limit: elementPerPage, page: page.current });
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    const newComment: Comment[] = res.data ?? [];

    setComments((prevComments) => [...prevComments, ...newComment]);
  }

  async function fetchMoreStoryNodeComments() {
    if (!storyNodeId) return;

    setLoading(true);
    const res = await commentService.getStoryNodeComments(storyId, storyNodeId, { limit: elementPerPage, page: page.current });
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    const newComment: Comment[] = res.data ?? [];

    setComments((prevComments) => [...prevComments, ...newComment]);
  }

  // call api to remove user's comment
  async function deleteComment(comment: Comment) {
    const res = await commentService.deleteComment(comment.id);

    if (!res.success) return toast.warning(res.message);

    setComments((prev) => prev.filter((prevComment) => prevComment.id !== comment.id));

    toast.message("Xóa bình luận thành công");
  }

  async function handleGetMoreComments() {
    if (storyNodeId) fetchMoreStoryNodeComments();
    else if (storyId) fetchMoreStoryComments();
  }

  function updateUiWithNewComment(newComment: Comment) {
    setComments((prev) => [newComment, ...prev]);
  }

  useEffect(() => {
    async function fetchStoryNodeComments() {
      if (!storyNodeId) return;

      setLoading(true);
      const res = await commentService.getStoryNodeComments(storyId, storyNodeId, { limit: elementPerPage, page: 1 });
      setLoading(false);

      if (!res.success) return toast.warning(res.message);

      setComments(res.data ?? []);
      setPagination(res.pagination);
    }

    async function fetchStoryComments() {
      if (!storyId) return;

      setLoading(true);
      const res = await commentService.getStoryComments(storyId, { limit: elementPerPage, page: 1 });
      setLoading(false);

      if (!res.success) return toast.warning(res.message);

      setComments(res.data ?? []);
      setPagination(res.pagination);
    }

    if (storyNodeId) fetchStoryNodeComments();
    else if (storyId) fetchStoryComments();
  }, [storyNodeId, storyId]);

  const isMoreContent = comments.length < (pagination?.totalItems ?? 0);
  const contentLeft = (pagination?.totalItems ?? 0) - comments.length;

  let breakpointColumnsObj;
  if (comments.length < elementPerPage) {
    const size = comments.length;
    breakpointColumnsObj = {
      default: 4 < size ? 4 : size,
      1400: 4 < size ? 4 : size,
      1100: 3 < size ? 3 : size,
      700: 2 < size ? 2 : size,
      500: 2 < size ? 2 : size,
      300: 2 < size ? 2 : size,
    };
  }

  return (
    <div className={`flex flex-col justify-center items-center gap-2 ${className}`}>
      <div className="w-full flex flex-row justify-between items-center">
        <h2 className="text-start px-1 font-semibold">
          Comment{" "}
          <span className="text-[0.6em] font-normal">
            ({comments.length}/{pagination?.totalItems})
          </span>
        </h2>

        {user && (
          <CommentButton
            storyId={storyId}
            storyNodeId={storyNodeId}
            onSubmit={(neComment) => {
              neComment && updateUiWithNewComment(neComment);
            }}
          />
        )}
      </div>

      {comments.length > 0 ? (
        <>
          {comments.length > elementPerPage ? (
            <MasonryGrid breakpointCols={breakpointColumnsObj}>
              {comments.map((commment, i) => (
                <CommentCard
                  key={commment.id}
                  comment={commment}
                  className={`w-full border-2 ${user?.id == commment.user?.id ? "border-purple-500" : "border-transparent"}`}
                  onDelete={commment.user?.id == user?.id ? () => deleteComment(commment) : undefined}
                />
              ))}
            </MasonryGrid>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              {comments.map((commment, i) => (
                <CommentCard
                  key={commment.id ?? i}
                  comment={commment}
                  className={`w-full border-2 ${user?.id == commment.user?.id ? "border-purple-500" : "border-transparent"}`}
                  onDelete={commment.user?.id == user?.id ? () => deleteComment(commment) : undefined}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {!loading && (
            <div className="flex flex-col justify-center items-center gap-2 md:text-[1.2em]">
              <div className="text-center p-10 py-5">
                {user ? (
                  "Chưa có bình luận nào, hãy trở thành người bình luận đầu tiên"
                ) : (
                  <Link href={"/login"} className="my-2">
                    <Image src="/login.png" alt="Require login" width={100} height={100} className="m-auto px-5 pt-5 pb-2 rounded-lg bg-white/80" />
                    <p className="m-auto my-3">Đăng nhập để để lại bình luận</p>
                  </Link>
                )}
              </div>
              {user && (
                <CommentButton
                  storyId={storyId}
                  storyNodeId={storyNodeId}
                  onSubmit={(neComment) => {
                    neComment && updateUiWithNewComment(neComment);
                  }}
                />
              )}
            </div>
          )}
        </>
      )}

      {loading && <Loading className="h-24" />}

      {comments.length > 0 && (
        <button
          onClick={() => {
            page.current++;
            handleGetMoreComments();
          }}
          disabled={!isMoreContent}
          className={`px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 
            ${isMoreContent ? "cursor-pointer hover:bg-foreground/20" : ""}`}
        >
          {isMoreContent ? `Show more (${contentLeft})` : "You are at the end"}
        </button>
      )}
    </div>
  );
}
