/*
  Warnings:

  - You are about to drop the column `last_position` on the `ReadingHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReadingHistory" DROP COLUMN "last_position",
ADD COLUMN     "content_id" UUID;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "StoryNodeContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
