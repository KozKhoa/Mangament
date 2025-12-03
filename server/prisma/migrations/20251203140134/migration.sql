/*
  Warnings:

  - A unique constraint covering the columns `[user_id,story_id,story_node_id]` on the table `ReadingHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ReadingHistory_user_id_story_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "ReadingHistory_user_id_story_id_story_node_id_key" ON "ReadingHistory"("user_id", "story_id", "story_node_id");
