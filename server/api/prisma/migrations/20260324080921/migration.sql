/*
  Warnings:

  - You are about to drop the column `content_id` on the `ReadingHistory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReadingHistory" DROP CONSTRAINT "ReadingHistory_content_id_fkey";

-- AlterTable
ALTER TABLE "ReadingHistory" DROP COLUMN "content_id",
ADD COLUMN     "last_position" JSONB;
