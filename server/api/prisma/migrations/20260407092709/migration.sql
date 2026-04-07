/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "is_deleted",
ADD COLUMN     "delted_status" "DeletedStatus" NOT NULL DEFAULT 'not_deleted';
