-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "newest_chapter_id" UUID;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_newest_chapter_id_fkey" FOREIGN KEY ("newest_chapter_id") REFERENCES "StoryNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
