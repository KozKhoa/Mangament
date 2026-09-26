import { Worker } from "bullmq";
import db from "../../../configs/db.js";
import { connection } from "./connection.js";

export const embeddingStoryWorker = new Worker(
  "embedding-story",
  async (job) => {
    const { storyId } = job.data;

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: {
        title: true,
        summary: true,
        genres: { select: { genre: { select: { name: true } } } },
        authors: { select: { author_id: true } },
      },
    });

    const { title, summary, authors } = story;
    const genres = story.genres.map((genre) => genre.genre.name);

    console.log(`Begin embedding story ${title}`);

    const embed = await fetch(`${process.env.ML_SERVICE_URL}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${title}. ${summary}. ${genres.join(", ")}. ${authors.map((a) => a.author_id).join(", ")}.`,
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

    console.log("Finish embedding story", title);
  },
  { connection, concurrency: 1 },
);
