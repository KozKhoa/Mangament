/*
  Warnings:

  - You are about to drop the column `url` on the `Image` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[path]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Image_url_key";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "url",
ADD COLUMN     "path" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Image_path_key" ON "Image"("path");
