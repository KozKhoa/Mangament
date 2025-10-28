/*
  Warnings:

  - You are about to drop the column `number_of_chapter` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Story" DROP COLUMN "number_of_chapter",
ADD COLUMN     "number_of_children" INTEGER;

-- AlterTable
ALTER TABLE "public"."StoryNode" ADD COLUMN     "number_of_children" INTEGER NOT NULL DEFAULT 0;
