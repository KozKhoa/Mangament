/*
  Warnings:

  - The `other_titles` column on the `Story` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "other_titles",
ADD COLUMN     "other_titles" TEXT[];
