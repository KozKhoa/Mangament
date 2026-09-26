import { Worker } from "bullmq";
import db from "../../../configs/db.js";
import { connection } from "./connection.js";

export const hardDeleteStoryWorker = new Worker(
  "hard-delete-story",
  async (job) => {
    const { storyId } = job.data;

    await db.story
      .delete({
        where: { id: storyId },
      })
      .catch(async (error) => {
        const story = await db.story.findUnique({ where: { id: storyId } });
        if (!story) throw new Error("Story not found");

        throw new Error(error);
      });

    console.log("Finish permenant deleted story", storyId);
  },
  { connection, concurrency: 1 },
);

export const hardDeleteManyStoriesWorker = new Worker(
  "hard-delete-many-stories",
  async (job) => {
    const { storyIds } = job.data;

    await db.story.deleteMany({ where: { id: { in: storyIds } } });

    console.log("Finish permenant deleted many stories", storyIds);
  },
  { connection, concurrency: 1 },
);
