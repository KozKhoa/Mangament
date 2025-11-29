import { toast } from "sonner";
import { useEffect, useState } from "react";

import { CommentParams } from "@/types/params";
import Story from "@/types/story";
import StoryNode from "@/types/story-node";

import commentService from "@/services/comment";

import useAuth from "@/contexts/AuthContext";
import SwitchPageBig from "../switch-page/big";
import Loading from "../loadings/loading";
import CommentInput from "../inputs/comment-input";
import CommentBox from "../boxs/comment-box";
import Comment from "@/types/comment";

interface RatingList {
  story?: Story;
  storyNode?: StoryNode;
  userId?: string;
  elementPerPage?: number;

  className?: string;
}

export default function CommentList({ story, storyNode, elementPerPage = 5, className }: RatingList) {
  const auth = useAuth();
  const user = auth?.user;

  const [page, setPage] = useState<number>(1);
  const [count, setCount] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>();
  const [params, setParams] = useState<CommentParams>({ sort: "created_at:desc", limit: elementPerPage, page: page });

  async function fetchComment() {
    if (!story && !storyNode) return;

    let resComment;
    let resCount;
    if (story) {
      resComment = await commentService.getStoryComments(story?.id, params);
      resCount = await commentService.countStoryComment(story?.id);
    } else if (storyNode) {
      resComment = await commentService.getStoryNodeComments(storyNode.id, params);
      resCount = await commentService.countStoryNodeComment(storyNode?.id);
    }

    if (!resComment || !resCount) return toast.error("Sever error");
    if (!resComment.success) return toast.warning(resComment.message);

    setComments(resComment.data);
    setCount(resCount.data);
  }

  async function postComment(message: string) {
    let res;
    if (story) {
      res = await commentService.postStoryComment(story?.id || "", user?.id || "", message);
    } else {
      res = await commentService.postStoryNodeComment(storyNode?.id || "", user?.id || "", message);
    }
    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    fetchComment();

    return toast.message(res.message);
  }

  useEffect(() => {
    fetchComment();
  }, [params]);

  useEffect(() => {
    setParams((prev) => {
      return {
        ...prev,
        page: page,
      };
    });
  }, [page]);

  useEffect(() => {
    fetchComment();
  }, [story]);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <h2 className="font-bold m-auto border-b-2">Bình luận</h2>

      <CommentInput onFinish={postComment}></CommentInput>

      {count ? (
        <>
          <div className="flex flex-col gap-2.5 justify-center ml-2 md:ml-10">
            <div className="flex flex-row flex-wrap justify-between items-center">
              <h3>{count} bình luận khác</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {comments?.map((v, i) => (
                <CommentBox key={i} comment={v}></CommentBox>
              ))}
            </div>
          </div>
          <SwitchPageBig className="m-auto" page={page} maxPage={Math.ceil(count / elementPerPage)} onChange={setPage}></SwitchPageBig>{" "}
        </>
      ) : (
        <div className="flex flex-col justify-center items-center p-2">
          <h3 className="font-bold">Không có bình luận nào khác</h3>
          <p>Hãy trở thành người bình luận đầu tiên</p>
        </div>
      )}
    </div>
  );
}
