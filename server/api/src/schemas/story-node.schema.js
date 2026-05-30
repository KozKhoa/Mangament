import { z } from "zod";
import { booleanSchema } from "./default.schemas.js";

export class StoryNodeSchemas {
  getStoryNode = z.object({
    params: z.object({
      id: z.string().uuid("Invalid story node ID"),
    }),
    query: z.object({
      isGettingChildren: booleanSchema.optional(),
      isGettingContent: booleanSchema.optional(),
    }),
    body: z.any().optional(),
  });

  increaseView = z.object({
    params: z.object({
      id: z.string().uuid("Invalid story node ID"),
    }),
    body: z.any().optional(),
    query: z.any().optional(),
  });
}

const storyNodeSchemas = new StoryNodeSchemas();
export default storyNodeSchemas;
