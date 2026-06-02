/*
  Warnings:

  - You are about to drop the column `other_title` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "other_title",
ADD COLUMN     "other_titles" TEXT[] DEFAULT ARRAY[]::TEXT[];
