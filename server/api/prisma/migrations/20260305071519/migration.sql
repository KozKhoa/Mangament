-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "avatar_id" UUID;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
