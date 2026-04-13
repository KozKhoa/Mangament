-- Function to handle update story node when it being soft deleted
CREATE OR REPLACE FUNCTION handle_soft_deleted_story_node_children()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete story node children when it being soft deleted
  IF OLD.deleted_status = 'not_deleted' AND NEW.deleted_status = 'soft_deleted' THEN
    UPDATE "StoryNode"
    SET deleted_status = 'soft_deleted'
    WHERE parent_id = OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_to_soft_deleted_stn_children_when_it_being_soft_deleted ON "StoryNode";

-- CREATE TRIGGER FOR UPDATE STORY NODE CHILDREN STATUS WHEN IT BEING SOFT DELETED
CREATE TRIGGER trigger_to_soft_deleted_stn_children_when_it_being_soft_deleted
AFTER UPDATE ON "StoryNode"
FOR EACH ROW
EXECUTE FUNCTION handle_soft_deleted_story_node_children();
