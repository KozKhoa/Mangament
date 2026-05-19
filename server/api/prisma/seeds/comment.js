import db from "../../configs/db.js";

import { randomInt } from "crypto";

import { faker } from "@faker-js/faker";

export default async function main() {
  const users = await db.user.findMany();
  const stories = await db.story.findMany();
  const storyNodes = await db.storyNode.findMany();

  const commentsCount = 1000;

  console.log("Start seeding comments");

  // Create top-level comments first
  await db.comment.createMany({
    data: Array.from({ length: commentsCount }).map((_, i) => {
      const user = users[randomInt(users.length)];
      const story = stories[randomInt(stories.length)];
      const storyNode = Math.random() > 0.5 ? storyNodes[randomInt(storyNodes.length)] : null;

      return {
        user_id: user.id,
        story_id: storyNode ? storyNode.story_id : story.id,
        story_node_id: storyNode ? storyNode.id : null,
        title: `Comment ${i}`,
        content: `Random comment content ${i} for story ${story.title}.`,
      };
    }),
    skipDuplicates: true,
  });

  // Create some replies
  const topLevelComments = await db.comment.findMany({ take: 200 });
  if (topLevelComments.length > 0) {
    await db.comment.createMany({
      data: Array.from({ length: 300 }).map((_, i) => {
        const parent = topLevelComments[randomInt(topLevelComments.length)];
        const user = users[randomInt(users.length)];

        return {
          user_id: user.id,
          story_id: parent.story_id,
          story_node_id: parent.story_node_id,
          parent_id: parent.id,
          title: `Reply ${i}`,
          content: `This is a reply to comment ${parent.title}.`,
        };
      }),
      skipDuplicates: true,
    });
  }

  console.log("Seeded comments");
}
