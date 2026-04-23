import { z } from "zod";

import { paginationQuerySchema, arrayStringSchema, arrayOfRangeNumberSchema, dateSchema } from "./default.schemas.js";

export class HistorySchemas {
  getAllHistories = z.object({
    params: z.any().optional(),
    query: paginationQuerySchema.extend({
      type: arrayStringSchema.optional(),
      author: arrayStringSchema.optional(),
      genre: arrayStringSchema.optional(),
      star: arrayOfRangeNumberSchema.optional(),
      view: arrayOfRangeNumberSchema.optional(),
      fromDate: dateSchema.optional(),
      toDate: dateSchema.optional(),
    }),
    body: z.any().optional(),
  });

  addHistory = z.object({
    params: z.object({
      storyId: z.string().uuid("Invalid story ID"),
      storyNodeId: z.string().uuid("Invalid story node ID"),
    }),
    body: z.any().optional(),
    query: z.any().optional(),
  });

  deleteHistory = z.object({
    params: z.object({
      id: z.string().uuid("Invalid history ID"),
    }),
    body: z.any().optional(),
    query: z.any().optional(),
  });
}

const historySchemas = new HistorySchemas();
export default historySchemas;
