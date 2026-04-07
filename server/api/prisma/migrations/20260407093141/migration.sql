/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `ReadingHistory` table. All the data in the column will be lost.
  - You are about to drop the column `delted_status` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `StoryNode` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `StoryNodeContent` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';

-- AlterTable
ALTER TABLE "ReadingHistory" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "delted_status",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';

-- AlterTable
ALTER TABLE "StoryNode" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';

-- AlterTable
ALTER TABLE "StoryNodeContent" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';
