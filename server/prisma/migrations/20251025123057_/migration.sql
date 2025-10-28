-- AlterTable
ALTER TABLE "StoryNode" ADD COLUMN     "poster_id" UUID;

-- AddForeignKey
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
