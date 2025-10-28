/*
  Warnings:

  - A unique constraint covering the columns `[user_id,story_id]` on the table `FavouriteStory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FavouriteStory_user_id_story_id_key" ON "FavouriteStory"("user_id", "story_id");
