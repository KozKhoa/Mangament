import { z } from "zod";

import { paginationQuerySchema } from "./default.schemas.js";

export class CommentSchemas {
  getAllComments = z.object({
    params: z.object({
      storyId: z.string().uuid("Invalid story ID").optional(),
      storyNodeId: z.string().uuid("Invalid story node ID").optional(),
    }),
    query: paginationQuerySchema,
    body: z.any().optional(),
  });

  postComment = z.object({
    params: z.object({
      storyId: z.string().uuid("Invalid story ID").optional(),
      storyNodeId: z.string().uuid("Invalid story node ID").optional(),
    }),
    body: z.object({
      title: z.string({ message: "Title is required" }).min(1, "Title must be at least 1 characters").max(100, "Title must be less than 100 characters"),
      content: z.string({ message: "Content is required" }).min(1, "Content must be at least 1 characters"),
    }),
    query: z.any().optional(),
  });

  updateComment = z.object({
    params: z.object({
      id: z.string().uuid("Invalid comment ID"),
    }),
    body: z.object({
      title: z.string().min(1, "Title must be at least 1 characters").max(100, "Title must be less than 100 characters").optional(),
      content: z.string().min(1, "Content must be at least 1 characters").optional(),
    }),
    query: z.any().optional(),
  });

  deleteComment = z.object({
    params: z.object({
      id: z.string().uuid("Invalid comment ID"),
    }),
    body: z.any().optional(),
    query: z.any().optional(),
  });
}

const commentSchemas = new CommentSchemas();
export default commentSchemas;
