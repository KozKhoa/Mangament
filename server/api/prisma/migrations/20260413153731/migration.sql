-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "other_titles" DROP NOT NULL,
ALTER COLUMN "other_titles" SET DATA TYPE TEXT;
