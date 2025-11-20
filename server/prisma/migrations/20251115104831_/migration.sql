/*
  Warnings:

  - Made the column `order_index` on table `StoryNode` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StoryNode" ALTER COLUMN "order_index" SET NOT NULL;
