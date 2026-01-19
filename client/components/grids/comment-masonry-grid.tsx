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

interface StoryNodeCommentsGridProps {
  className?: string;
  storyNodeId?: string;
  storyId?: string;
  elementPerPage?: number;
}

const SWITCH_LAYOUT = 4;

function CommentButton({ storyId, storyNodeId }: { storyId?: string; storyNodeId?: string }) {
  return (
    <button
      onClick={() => {
        modal.open("custom", {
          content: <CommentInputForm onCancel={modal.close} onSubmit={modal.close} storyId={storyId} storyNodeId={storyNodeId}></CommentInputForm>,
        });
      }}
      className="px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 cursor-pointer hover:bg-foreground/20"
    >
      Đánh giá ➤
    </button>
  );
}

export default function CommentMasonryGrid({ className, storyNodeId, storyId, elementPerPage = 8 }: StoryNodeCommentsGridProps) {
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
    const res = await commentService.getStoryNodeComments(storyNodeId, { limit: elementPerPage, page: page.current });
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    const newComment: Comment[] = res.data ?? [];

    setComments((prevComments) => [...prevComments, ...newComment]);
  }

  function handleGetMoreComments() {
    if (storyNodeId) fetchMoreStoryNodeComments();
    else if (storyId) fetchMoreStoryComments();
  }

  useEffect(() => {
    async function fetchStoryNodeComments() {
      if (!storyNodeId) return;

      setLoading(true);
      const res = await commentService.getStoryNodeComments(storyNodeId, { limit: elementPerPage, page: 1 });
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

        <CommentButton storyId={storyId}></CommentButton>
      </div>

      {comments.length > 0 ? (
        <>
          {comments.length > SWITCH_LAYOUT ? (
            <MasonryGrid breakpointCols={breakpointColumnsObj}>
              {comments.map((commment, i) => (
                <CommentCard key={commment.id} comment={commment}></CommentCard>
              ))}
            </MasonryGrid>
          ) : (
            <div className="flex flex-col gap-2 justify-center items-center">
              {comments.map((commment, i) => (
                <CommentCard className="w-full" key={commment.id} comment={commment}></CommentCard>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {!loading && (
            <div className="flex flex-col justify-center items-center gap-2 md:text-[1.2em]">
              <p className="text-center p-10 py-5">Chưa có bình luận nào, hãy trở thành người bình luận đầu tiên</p>
              <CommentButton storyId={storyId} storyNodeId={storyNodeId}></CommentButton>
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
