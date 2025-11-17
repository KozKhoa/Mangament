/*
  Warnings:

  - The `content` column on the `StoryNode` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "StoryNode" DROP COLUMN "content",
ADD COLUMN     "content" JSONB[] DEFAULT ARRAY[]::JSONB[];
