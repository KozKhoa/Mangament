import { z } from "zod";
import { paginationQuerySchema, arrayStringSchema, arrayOfRangeNumberSchema, dateSchema, booleanSchema, genderSchema } from "./default.schemas.js";

const idsBodySchema = z.object({
  ids: z.array(z.string().uuid("Invalid ID format")).min(1, "At least one ID is required"),
});

const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export class AdminSchemas {
  // Dashboard
  dashboardView = z.object({
    query: z.object({
      fromDate: dateSchema.optional().default(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
      }),
      toDate: dateSchema.optional().default(() => new Date()),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
      storyId: z.string().uuid().optional(),
      storyNodeId: z.string().uuid().optional(),
    }),
  });

  dashboardNewUsers = z.object({
    query: z.object({
      fromDate: dateSchema.optional().default(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
      }),
      toDate: dateSchema.optional().default(() => new Date()),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    }),
  });

  // Users
  getAllUsers = z.object({
    query: paginationQuerySchema.extend({
      genders: arrayStringSchema.optional(),
      roles: arrayStringSchema.optional(),
      isBanned: booleanSchema.optional(),
      fromDate: dateSchema.optional(),
      toDate: dateSchema.optional(),
      search: z.string().optional(),
    }),
  });

  getUser = z.object({
    params: uuidParamSchema,
  });

  banUser = z.object({
    params: uuidParamSchema,
    body: z.object({
      isBanned: z.boolean({ required_error: "isBanned is required" }),
    }),
  });

  deleteUser = z.object({
    params: uuidParamSchema,
  });

  updateUser = z.object({
    params: uuidParamSchema,
    body: z.object({
      role: z.enum(["admin", "user"]).optional(),
      name: z.string().min(1).optional(),
    }),
  });

  // Stories
  getStory = z.object({
    params: uuidParamSchema,
    query: z.object({
      isGettingChildren: booleanSchema.optional(),
      isGettingContent: booleanSchema.optional(),
      isGettingTrashStoryNode: booleanSchema.optional(),
      isGettingTrashContent: booleanSchema.optional(),
    }),
  });

  getAllStories = z.object({
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
  });

  postStory = z.object({
    body: z.object({
      title: z.string().min(1, "Title is required"),
      type: z.string().min(1, "Type is required"),
      nation: z.string().optional(),
      summary: z.string().optional(),
      status: z.string().optional(),
      genre: z.any().optional(), // usually an array or string from form-data
      authorIds: z.any().optional(),
      coverArt: z.any().optional(),
      other_titles: z.any().optional(),
    }),
  });

  updateStoryCoverArt = z.object({
    params: uuidParamSchema,
    body: z.object({
      coverArt: z.any().optional(),
    }),
  });

  updateStory = z.object({
    params: uuidParamSchema,
    body: z.object({
      title: z.string().optional(),
      type: z.string().optional(),
      nation: z.any().optional(),
      summary: z.string().optional(),
      status: z.string().optional(),
      genre: z.any().optional(),
      authorIds: z.any().optional(),
      children: z.any().optional(),
      coverArt: z.any().optional(),
      other_titles: z.any().optional(),
    }),
  });

  toggleActiveStory = z.object({
    params: uuidParamSchema,
    body: z.object({
      isActived: z.boolean({ required_error: "isActived is required" }),
    }),
  });

  deleteStory = z.object({
    params: uuidParamSchema,
  });

  // Trash & Restore
  getAllTrashImages = z.object({
    query: paginationQuerySchema,
  });

  deleteTrashImage = z.object({
    params: uuidParamSchema,
  });

  deleteManyTrashImages = z.object({
    body: idsBodySchema,
  });

  getAllTrashStories = z.object({
    query: paginationQuerySchema,
  });

  deleteTrashStory = z.object({
    params: uuidParamSchema,
  });

  deleteManyTrashStories = z.object({
    body: idsBodySchema,
  });

  restoreTrashStory = z.object({
    params: uuidParamSchema,
  });

  restoreManyTrashStories = z.object({
    body: idsBodySchema,
  });

  deletePermanentlyTrashStoryNode = z.object({
    params: uuidParamSchema,
  });

  deletePermanentlyManyTrashStoryNodes = z.object({
    body: idsBodySchema,
  });

  restoreTrashStoryNode = z.object({
    params: uuidParamSchema,
  });

  restoreManyTrashStoryNodes = z.object({
    body: idsBodySchema,
  });

  getAllStoryNodesTrash = z.object({
    query: paginationQuerySchema.extend({
      storyId: z.string().uuid().optional(),
      parentId: z.string().uuid().optional(),
    }),
  });
}

const adminSchemas = new AdminSchemas();
export default adminSchemas;
