-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "poster_id" UUID;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
