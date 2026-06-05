import { redis } from "../../configs/redis.js";
import { Queue } from "bullmq";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const ATTEMP = 3;
const DELAY = 5000;

const ADD_JOB_OPTION = { attempts: ATTEMP, backoff: { type: "exponential", delay: DELAY }, removeOnComplete: true, removeOnFail: true };

class StoryQueue {
  #hardDeleteStoryQueue = new Queue("hard-delete-story", { connection });
  #hardDeleteManyStoriesQueue = new Queue("hard-delete-many-stories", { connection });
  #embeddingStoryQueue = new Queue("embedding-story", { connection });
  #updateStory = new Queue("update-story", { connection });

  addJob_EmbeddingStory(storyId) {
    this.#embeddingStoryQueue.add("updateEmbeddingStory", { storyId }, ADD_JOB_OPTION);
  }

  addJob_HardDeleteStory(storyId) {
    this.#hardDeleteStoryQueue.add("hardDeleteStory", { storyId }, ADD_JOB_OPTION);
  }

  addJob_HardDeleteManyStories(storyIds) {
    this.#hardDeleteManyStoriesQueue.add("hardDeleteManyStories", { storyIds }, ADD_JOB_OPTION);
  }

  addJob_UpdateStory(
    storyId,
    { title, otherTitles = [], type, view, summary, posterId, nation, status, genres = [], coverArt, nextChapterIn, authorIds = [], children },
    editorEmail,
  ) {
    console.log(`Already add ${title} to updated story queue`);
    this.#updateStory.add(
      "updateStory",
      { storyId, editorEmail, title, otherTitles, type, view, summary, posterId, nation, status, genres, coverArt, nextChapterIn, authorIds, children },
      ADD_JOB_OPTION,
    );
  }
}

const storyQueue = new StoryQueue();
export default storyQueue;
