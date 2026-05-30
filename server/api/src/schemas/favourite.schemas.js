import { z } from "zod";

import { paginationQuerySchema, arrayStringSchema, arrayOfRangeNumberSchema } from "./default.schemas.js";

export class FavouriteSchemas {
  getAllFavourites = z.object({
    params: z.any().optional(),
    query: paginationQuerySchema.extend({
      type: arrayStringSchema.optional(),
      author: arrayStringSchema.optional(),
      genre: arrayStringSchema.optional(),
      star: arrayOfRangeNumberSchema.optional(),
      view: arrayOfRangeNumberSchema.optional(),
      nation: arrayStringSchema.optional(),
      status: arrayStringSchema.optional(),
    }),
    body: z.any().optional(),
  });

  addFavourite = z.object({
    params: z.object({
      id: z.string().uuid("Invalid story ID"),
    }),
    body: z.any().optional(),
    query: z.any().optional(),
  });

  deleteFavourite = z.object({
    params: z.object({
      id: z.string().uuid("Invalid favourite ID"),
    }),
    body: z.any().optional(),
    query: z.any().optional(),
  });
}

const favouriteSchemas = new FavouriteSchemas();
export default favouriteSchemas;
