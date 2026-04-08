/*
  Warnings:

  - You are about to drop the column `plain_text` on the `StoryNode` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `StoryNode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StoryNode" DROP COLUMN "plain_text",
DROP COLUMN "search_vector";
