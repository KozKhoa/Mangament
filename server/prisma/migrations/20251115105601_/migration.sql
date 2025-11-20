/*
  Warnings:

  - You are about to alter the column `order_index` on the `StoryNode` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "StoryNode" ALTER COLUMN "order_index" SET DATA TYPE INTEGER;
