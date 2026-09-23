-- AlterTable
ALTER TABLE "Story" ADD COLUMN "children" JSONB NOT NULL DEFAULT '[]'::jsonb;

