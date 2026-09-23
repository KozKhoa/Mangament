-- AlterTable
ALTER TABLE "Story" ADD COLUMN "children" JSONB DEFAULT '[]'::jsonb;

