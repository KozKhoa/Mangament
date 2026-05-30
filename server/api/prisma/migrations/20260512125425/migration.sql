/*
  Warnings:

  - The primary key for the `Story_Genre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `genre` on the `Story_Genre` table. All the data in the column will be lost.
  - Added the required column `genre_id` to the `Story_Genre` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Story_Genre" DROP CONSTRAINT "Story_Genre_pkey",
DROP COLUMN "genre",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted',
ADD COLUMN     "genre_id" UUID NOT NULL,
ADD CONSTRAINT "Story_Genre_pkey" PRIMARY KEY ("story_id", "genre_id");

-- DropEnum
DROP TYPE "Genre";

-- CreateTable
CREATE TABLE "Genre" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumb_nail_id" UUID,
    "deleted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted',

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_thumb_nail_id_fkey" FOREIGN KEY ("thumb_nail_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_Genre" ADD CONSTRAINT "Story_Genre_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
