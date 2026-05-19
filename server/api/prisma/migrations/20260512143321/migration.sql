/*
  Warnings:

  - You are about to drop the column `thumb_nail_id` on the `Genre` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Genre" DROP CONSTRAINT "Genre_thumb_nail_id_fkey";

-- AlterTable
ALTER TABLE "Genre" DROP COLUMN "thumb_nail_id",
ADD COLUMN     "thumbnail_id" UUID;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
