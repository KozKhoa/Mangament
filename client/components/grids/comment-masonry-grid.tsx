import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import MasonryGrid from "./masonry-grid";
import Loading from "../loadings/loading";
import CommentCard from "../cards/comment-card";

import commentService from "@/services/comment";

import Comment from "@/types/comment";
import { Pagination } from "@/types/pagination";

interface StoryNodeCommentsGridProps {
  className?: string;
  storyNodeId?: string;
  storyId?: string;
  elementPerPage?: number;
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
    breakpointColumnsObj = {
      default: 4,
      1400: 4,
      1100: 3,
      700: 2,
      500: 2,
      300: 2,
    };
  } else {
    breakpointColumnsObj = {
      default: 6,
      1400: 5,
      1100: 4,
      700: 3,
      500: 2,
      300: 1,
    };
  }

  return (
    <div className={`flex flex-col justify-center items-center gap-2 ${className}`}>
      <h2 className="w-full text-start px-1 font-semibold">
        Comment{" "}
        <span className="text-[0.6em] font-normal">
          ({comments.length}/{pagination?.totalItems})
        </span>
      </h2>

      {comments.length > 0 ? (
        <MasonryGrid breakpointCols={breakpointColumnsObj}>
          {comments.map((commment, i) => (
            <CommentCard key={commment.id} comment={commment}></CommentCard>
          ))}
        </MasonryGrid>
      ) : (
        <>
          {!loading && (
            <div className="flex flex-col justify-center items-center gap-2 md:text-[1.2em]">
              <p className="text-center p-10 py-5">Chưa có bình luận nào, hãy trở thành người bình luận đầu tiên</p>
              <button className="px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 cursor-pointer hover:bg-foreground/20">
                Bình luận ➤
              </button>
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
