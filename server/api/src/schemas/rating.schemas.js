import { z } from "zod";
import { paginationQuerySchema, arrayOfRangeNumberSchema } from "./default.schemas.js";

export class RatingSchemas {
  getAllRatings = z.object({
    params: z.object({
      id: z.string().uuid("Invalid story ID"),
    }),
    query: paginationQuerySchema.extend({
      star: arrayOfRangeNumberSchema.optional(),
    }),
    body: z.any().optional(),
  });

  postRating = z.object({
    params: z.object({
      id: z.string().uuid("Invalid story ID"),
    }),
    body: z.object({
      star: z.preprocess((val) => Number(val), z.number().int().min(1).max(5)),
      title: z.string({ message: "Title is required" }).min(1, "Title must be at least 1 characters").max(100, "Title must be less than 100 characters"),
      content: z.string({ message: "Content is required" }).min(1, "Content must be at least 1 characters"),
    }),
    query: z.any().optional(),
  });

  putRating = z.object({
    params: z.object({
      id: z.string().uuid("Invalid rating ID"),
    }),
    body: z.object({
      star: z.preprocess((val) => Number(val), z.number().int().min(1).max(5)).optional(),
      title: z.string().min(1, "Title must be at least 1 characters").max(100, "Title must be less than 100 characters").optional(),
      content: z.string().min(1, "Content must be at least 1 characters").optional(),
    }),
    query: z.any().optional(),
  });

  deleteRating = z.object({
    params: z.object({
      id: z.string().uuid("Invalid rating ID"),
    }),
    body: z.any().optional(),
    query: z.any().optional(),
  });
}

const ratingSchemas = new RatingSchemas();
export default ratingSchemas;
