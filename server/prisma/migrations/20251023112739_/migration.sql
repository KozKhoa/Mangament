/*
  Warnings:

  - You are about to drop the column `create_at` on the `FavouriteStory` table. All the data in the column will be lost.
  - You are about to drop the column `create_at` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `create_at` on the `ReadingHistory` table. All the data in the column will be lost.
  - You are about to drop the column `create_at` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `update_at` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `create_at` on the `StoryNode` table. All the data in the column will be lost.
  - You are about to drop the column `update_at` on the `StoryNode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FavouriteStory" DROP COLUMN "create_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "create_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ReadingHistory" DROP COLUMN "create_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "create_at",
DROP COLUMN "update_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "StoryNode" DROP COLUMN "create_at",
DROP COLUMN "update_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
