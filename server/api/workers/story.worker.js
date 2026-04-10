import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";
import db from "../configs/db.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const updateEmbeddingStoryWorker = new Worker(
  "update-embedding-story",
  async (job) => {
    const { storyId } = job.data;

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: {
        title: true,
        summary: true,
        genres: { select: { genre: true } },
        authors: { select: { author_id: true } },
      },
    });

    const { title, summary, genres, authors } = story;

    const embed = await fetch(`${process.env.ML_SERVICE_URL}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${title}. ${summary}. ${genres.map((g) => g.genre).join(", ")}. ${authors.map((a) => a.author_id).join(", ")}.`,
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        return null;
      });

    const embedStory = embed.embedding ?? [];

    await db.$executeRaw`
      UPDATE "Story" SET embedding = ${`[${embedStory.join(",")}]`}::vector WHERE id = ${storyId}::uuid
    `;

    console.log("Embedding story", title);
  },
  { connection, concurrency: 1 },
);

const hardDeleteStoryWorker = new Worker(
  "hard-delete-story",
  async (job) => {
    const { storyId } = job.data;

    await db.story
      .delete({
        where: { id: storyId }, // Note: fixed variable id to storyId from original code
      })
      .catch(async (error) => {
        const story = await db.story.findUnique({ where: { id: storyId } });
        if (!story) throw new Error("Story not found");

        throw new Error(error);
      });

    console.log("Permenant deleted story", storyId);
  },
  { connection, concurrency: 1 },
);

const hardDeleteManyStoriesWorker = new Worker(
  "hard-delete-many-stories",
  async (job) => {
    const { storyIds } = job.data;
    await db.story.deleteMany({ where: { id: { in: storyIds } } });
  },
  { connection, concurrency: 1 },
);

export default { updateEmbeddingStoryWorker, hardDeleteStoryWorker, hardDeleteManyStoriesWorker };
