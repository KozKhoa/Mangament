-- CreateIndex
CREATE INDEX "StoryNode_parent_id_idx" ON "StoryNode"("parent_id");

-- CreateIndex
CREATE INDEX "StoryNode_story_id_parent_id_deleted_status_idx" ON "StoryNode"("story_id", "parent_id", "deleted_status");
