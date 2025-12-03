/*
  Warnings:

  - A unique constraint covering the columns `[user_id,story_id]` on the table `ReadingHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReadingHistory_user_id_story_id_key" ON "ReadingHistory"("user_id", "story_id");
