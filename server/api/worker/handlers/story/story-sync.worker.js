import { Worker } from "bullmq";
import db from "../../../configs/db.js";
import redisUtils from "../../../src/utils/Redis.js";
import * as storyService from "../../../src/services/story.service.js";
import { connection } from "./connection.js";

export const syncStoryChildrenWorker = new Worker(
  "sync-story-children",
  async (job) => {
    const { storyId } = job.data;
    console.log(`[SyncStoryChildren] Begin syncing children for story ${storyId}`);
    const tree = await storyService.SyncStoryChildren(storyId, db);
    await redisUtils.stories(storyId).incr();
    await redisUtils.stories().incr();
    await redisUtils.storyNodes(storyId).incr();
    await redisUtils.storyNodes().incr();
    console.log(`[SyncStoryChildren] Finish syncing children for story ${storyId}`);
    return tree;
  },
  { connection, concurrency: 5 },
);

syncStoryChildrenWorker.on("failed", (job, err) => {
  console.error(`[SyncStoryChildren] ❌ Job ${job?.id} thất bại (Lần thử ${job?.attemptsMade}/${job?.opts?.attempts}):`, err?.message || err);
});
