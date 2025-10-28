/*
  Warnings:

  - You are about to drop the column `rating` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Story" DROP COLUMN "rating",
ADD COLUMN     "star" DOUBLE PRECISION NOT NULL DEFAULT 0;
