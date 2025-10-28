/*
  Warnings:

  - A unique constraint covering the columns `[story_id,parent_id,order_index]` on the table `StoryNode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."StoryNode_parent_id_order_index_key";

-- CreateIndex
CREATE UNIQUE INDEX "StoryNode_story_id_parent_id_order_index_key" ON "public"."StoryNode"("story_id", "parent_id", "order_index");
