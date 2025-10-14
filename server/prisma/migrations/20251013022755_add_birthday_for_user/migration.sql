/*
  Warnings:

  - The primary key for the `FavouriteStory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Rating` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `FavouriteStory` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `Rating` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parent_id" UUID;

-- AlterTable
ALTER TABLE "FavouriteStory" DROP CONSTRAINT "FavouriteStory_pkey",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "FavouriteStory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_pkey",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Rating_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthday" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
