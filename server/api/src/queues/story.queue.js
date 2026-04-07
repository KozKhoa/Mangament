import { redis } from "../configs/redis.js";

import { Queue, Worker } from "bullmq";
import * as storyService from "../services/story.service.js";
import db from "../configs/db.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const ATTEMP = 3;
const DELAY = 5000;

const ADD_JOB_OPTION = { attempts: ATTEMP, backoff: { type: "exponential", delay: DELAY }, removeOnComplete: true, removeOnFail: true };

const updateEmbeddingStoryQueue = new Queue("update-embedding-story", { connection });
const updateEmbeddingStoryWorker = new Worker(
  "update-embedding-story",
  async (job) => {
    const { storyId } = job.data;
    await storyService.UpdateEmbeddingStory(storyId);
  },
  { connection, concurrency: 1 },
);

export function AddJobUpdateEmbeddingStory(storyId) {
  updateEmbeddingStoryQueue.add("updateEmbeddingStory", { storyId }, ADD_JOB_OPTION);
}

const hardDeleteStoryQueue = new Queue("hard-delete-story", { connection });
const hardDeleteStoryWorker = new Worker(
  "hard-delete-story",
  async (job) => {
    const { storyId } = job.data;
    await db.story
      .delete({
        where: { id: id },
      })
      .catch(async (error) => {
        const story = await db.story.findUnique({ where: { id: id } });
        if (!story) throw CreateError(404, "Story not found");

        throw new Error(error);
      });
  },
  { connection, concurrency: 1 },
);

export function AddJobHardDeleteStory(storyId) {
  hardDeleteStoryQueue.add("hardDeleteStory", { storyId }, ADD_JOB_OPTION);
}

const hardDeleteManyStoriesQueue = new Queue("hard-delete-many-stories", { connection });
const hardDeleteManyStoriesWorker = new Worker(
  "hard-delete-many-stories",
  async (job) => {
    const { storyIds } = job.data;
    await db.story.deleteMany({ where: { id: { in: storyIds } } });
  },
  { connection, concurrency: 1 },
);

export function AddJobHardDeleteManyStories(storyIds) {
  hardDeleteManyStoriesQueue.add("hardDeleteManyStories", { storyIds }, ADD_JOB_OPTION);
}
