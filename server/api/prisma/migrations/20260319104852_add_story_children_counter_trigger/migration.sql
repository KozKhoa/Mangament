
-- Function to handle adding a new story node
CREATE OR REPLACE FUNCTION handle_add_new_story_node()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase count for story (only incr if this node is direct child of story)
  IF NEW.story_id IS NOT NULL AND NEW.parent_id IS NULL AND NEW.is_deleted IS FALSE THEN
    UPDATE "Story"
    SET number_of_children = number_of_children + 1
    WHERE id = NEW.story_id;
  END IF;

  -- Increase count for parent node
  IF NEW.parent_id IS NOT NULL AND NEW.is_deleted IS FALSE THEN
    UPDATE "StoryNode"
    SET number_of_children = number_of_children + 1
    WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT
DROP TRIGGER IF EXISTS trigger_add_new_story_node ON "StoryNode";
CREATE TRIGGER trigger_add_new_story_node
AFTER INSERT ON "StoryNode"
FOR EACH ROW
EXECUTE FUNCTION handle_add_new_story_node();


--====================================================================================================
-- Function to handle all updates (soft delete, restore, move)
CREATE OR REPLACE FUNCTION handle_story_node_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Handle Soft Delete (False -> True)
  IF OLD.is_deleted IS FALSE AND NEW.is_deleted IS TRUE THEN
    IF OLD.story_id IS NOT NULL THEN
      UPDATE "Story" SET number_of_children = number_of_children - 1 WHERE id = OLD.story_id;
    END IF;
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE "StoryNode" SET number_of_children = number_of_children - 1 WHERE id = OLD.parent_id;
    END IF;

  -- 2. Handle Restore (True -> False)
  ELSIF OLD.is_deleted IS TRUE AND NEW.is_deleted IS FALSE THEN
    IF NEW.story_id IS NOT NULL THEN
      UPDATE "Story" SET number_of_children = number_of_children + 1 WHERE id = NEW.story_id;
    END IF;
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE "StoryNode" SET number_of_children = number_of_children + 1 WHERE id = NEW.parent_id;
    END IF;

  -- 3. Handle Move (When node is active)
  ELSIF NEW.is_deleted IS FALSE THEN
    -- Handle parent change
    IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
      IF OLD.parent_id IS NOT NULL THEN
        UPDATE "StoryNode" SET number_of_children = number_of_children - 1 WHERE id = OLD.parent_id;
      END IF;
      IF NEW.parent_id IS NOT NULL THEN
        UPDATE "StoryNode" SET number_of_children = number_of_children + 1 WHERE id = NEW.parent_id;
      END IF;
    END IF;

    -- Handle story change
    IF OLD.story_id IS DISTINCT FROM NEW.story_id THEN
      IF OLD.story_id IS NOT NULL THEN
        UPDATE "Story" SET number_of_children = number_of_children - 1 WHERE id = OLD.story_id;
      END IF;
      IF NEW.story_id IS NOT NULL THEN
        UPDATE "Story" SET number_of_children = number_of_children + 1 WHERE id = NEW.story_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for UPDATE
DROP TRIGGER IF EXISTS trigger_soft_deleted_story_node ON "StoryNode";
DROP TRIGGER IF EXISTS trigger_restored_story_node ON "StoryNode";
DROP TRIGGER IF EXISTS trigger_update_story_node ON "StoryNode";

CREATE TRIGGER trigger_update_story_node
AFTER UPDATE ON "StoryNode"
FOR EACH ROW
EXECUTE FUNCTION handle_story_node_update();


--====================================================================================================
-- Function to handle hard delete
CREATE OR REPLACE FUNCTION handle_hard_deleted_story_node()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if the node wasn't already soft-deleted 
  -- (If it was soft-deleted, count was already decremented by the update trigger)
  IF OLD.is_deleted IS FALSE THEN
    IF OLD.story_id IS NOT NULL THEN
      UPDATE "Story" SET number_of_children = number_of_children - 1 WHERE id = OLD.story_id;
    END IF;
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE "StoryNode" SET number_of_children = number_of_children - 1 WHERE id = OLD.parent_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for DELETE
DROP TRIGGER IF EXISTS trigger_hard_deleted_story_node ON "StoryNode";
CREATE TRIGGER trigger_hard_deleted_story_node
AFTER DELETE ON "StoryNode"
FOR EACH ROW
EXECUTE FUNCTION handle_hard_deleted_story_node();


--====================================================================================================
-- Sync script to initialize counts for existing data
-- This can be run once to ensure consistency

-- UPDATE "Story" s
-- SET number_of_children = (
--   SELECT COUNT(*)
--   FROM "StoryNode" sn
--   WHERE sn.story_id = s.id AND sn.parent_id IS NULL AND sn.is_deleted = false
-- );

-- UPDATE "StoryNode" sn_parent
-- SET number_of_children = (
--   SELECT COUNT(*)
--   FROM "StoryNode" sn_child
--   WHERE sn_child.parent_id = sn_parent.id AND sn_child.is_deleted = false
-- );


