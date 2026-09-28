-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('zip_upload', 'zip_remote_download', 'csv_upload', 'manual_input');

-- CreateEnum
CREATE TYPE "ImportSessionStatus" AS ENUM ('pending', 'merging', 'extracting', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ImportStoryAction" AS ENUM ('created', 'updated', 'skipped', 'failed');

-- CreateTable
CREATE TABLE "StoryImportSession" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "source_type" "ImportSourceType" NOT NULL DEFAULT 'zip_upload',
    "status" "ImportSessionStatus" NOT NULL DEFAULT 'pending',
    "session_id" TEXT,
    "file_name" TEXT,
    "file_size" BIGINT,
    "source_url" TEXT,
    "total_stories" INTEGER NOT NULL DEFAULT 0,
    "processed_stories" INTEGER NOT NULL DEFAULT 0,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_stories_count" INTEGER NOT NULL DEFAULT 0,
    "updated_stories_count" INTEGER NOT NULL DEFAULT 0,
    "imported_nodes_count" INTEGER NOT NULL DEFAULT 0,
    "imported_contents_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryImportItem" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "story_id" UUID,
    "story_title" TEXT NOT NULL,
    "action" "ImportStoryAction" NOT NULL DEFAULT 'created',
    "new_nodes_count" INTEGER NOT NULL DEFAULT 0,
    "new_contents_count" INTEGER NOT NULL DEFAULT 0,
    "is_cover_updated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryImportSession_session_id_key" ON "StoryImportSession"("session_id");

-- CreateIndex
CREATE INDEX "StoryImportSession_status_created_at_idx" ON "StoryImportSession"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "StoryImportSession_user_id_created_at_idx" ON "StoryImportSession"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "StoryImportItem_session_id_idx" ON "StoryImportItem"("session_id");

-- CreateIndex
CREATE INDEX "StoryImportItem_story_id_idx" ON "StoryImportItem"("story_id");

-- CreateIndex
CREATE INDEX "StoryImportItem_action_idx" ON "StoryImportItem"("action");

-- AddForeignKey
ALTER TABLE "StoryImportSession" ADD CONSTRAINT "StoryImportSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryImportItem" ADD CONSTRAINT "StoryImportItem_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "StoryImportSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryImportItem" ADD CONSTRAINT "StoryImportItem_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;
