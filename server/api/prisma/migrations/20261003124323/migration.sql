/*
  Warnings:

  - You are about to drop the column `newest_chapter_id` on the `Story` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_newest_chapter_id_fkey";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "newest_chapter_id";
