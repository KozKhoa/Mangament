/*
  Warnings:

  - You are about to drop the column `message` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Rating` table. All the data in the column will be lost.
  - Added the required column `content` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Rating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Rating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "message",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "message",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
