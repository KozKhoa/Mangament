-- Function to handle all updates (soft delete, restore, move)
CREATE OR REPLACE FUNCTION handle_story_node_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Handle Soft Delete (False -> True)
  IF OLD.deleted_status = 'not_deleted' AND NEW.deleted_status = 'soft_deleted' THEN
    IF OLD.story_id IS NOT NULL THEN
      UPDATE "Story" SET number_of_children = number_of_children - 1 WHERE id = OLD.story_id;
    END IF;
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE "StoryNode" SET number_of_children = number_of_children - 1 WHERE id = OLD.parent_id;
    END IF;

  -- 2. Handle Restore (True -> False)
  ELSIF OLD.deleted_status = 'soft_deleted'  AND NEW.deleted_status = 'not_deleted' THEN
    IF NEW.story_id IS NOT NULL THEN
      UPDATE "Story" SET number_of_children = number_of_children + 1 WHERE id = NEW.story_id;
    END IF;
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE "StoryNode" SET number_of_children = number_of_children + 1 WHERE id = NEW.parent_id;
    END IF;

  -- 3. Handle Move (When node is active)
  ELSIF NEW.deleted_status = 'not_deleted'  THEN
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
