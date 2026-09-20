/*
  Warnings:

  - You are about to drop the column `key` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `public_id` on the `Image` table. All the data in the column will be lost.
  - Added the required column `mine_type` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ImageProvider" AS ENUM ('local', 'r2', 's3');

-- DropIndex
DROP INDEX "Image_key_key";

-- DropIndex
DROP INDEX "Image_public_id_key";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "key",
DROP COLUMN "public_id",
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "mine_type" TEXT NOT NULL,
ADD COLUMN     "provider" "ImageProvider" NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
