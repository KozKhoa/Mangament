/*
  Warnings:

  - The values [true,false,deleted] on the enum `DeletedStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeletedStatus_new" AS ENUM ('not_deleted', 'soft_deleted', 'pending_permanent_deletion');
ALTER TABLE "public"."Story" ALTER COLUMN "delted_status" DROP DEFAULT;
ALTER TABLE "Story" ALTER COLUMN "delted_status" TYPE "DeletedStatus_new" USING ("delted_status"::text::"DeletedStatus_new");
ALTER TYPE "DeletedStatus" RENAME TO "DeletedStatus_old";
ALTER TYPE "DeletedStatus_new" RENAME TO "DeletedStatus";
DROP TYPE "public"."DeletedStatus_old";
ALTER TABLE "Story" ALTER COLUMN "delted_status" SET DEFAULT 'not_deleted';
COMMIT;
