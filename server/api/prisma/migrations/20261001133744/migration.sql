/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Image_hash_key" ON "Image"("hash");
