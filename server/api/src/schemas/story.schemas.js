import { z } from "zod";
import { paginationQuerySchema, arrayStringSchema, arrayOfRangeNumberSchema, booleanSchema } from "./default.schemas.js";

export class StorySchemas {
  getAllStories = z.object({
    params: z.any().optional(),
    query: paginationQuerySchema.extend({
      keyword: z.string().optional(),
      type: arrayStringSchema.optional(),
      author: arrayStringSchema.optional(),
      genre: arrayStringSchema.optional(),
      star: arrayOfRangeNumberSchema.optional(),
      view: arrayOfRangeNumberSchema.optional(),
      nation: arrayStringSchema.optional(),
      status: arrayStringSchema.optional(),
      isGettingChildren: booleanSchema.optional(),
      isGettingNewestChapter: booleanSchema.optional(),
    }),
    body: z.any().optional(),
  });

  getStory = z.object({
    params: z.object({
      id: z.string().uuid("Invalid story ID").optional(),
      title: z.string().optional(),
    }),
    query: z.object({
      isGettingChildren: booleanSchema.optional(),
      isGettingSummary: booleanSchema.optional(),
      isGettingNewestChapter: booleanSchema.optional(),
    }),
    body: z.any().optional(),
  });

  getRecommendStories = z.object({
    params: z.object({
      id: z.string().uuid("Invalid story ID"),
    }),
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
    body: z.any().optional(),
  });
}

const storySchemas = new StorySchemas();
export default storySchemas;
