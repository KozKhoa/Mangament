-- Function to handle update story node when it being soft deleted
CREATE OR REPLACE FUNCTION handle_soft_deleted_story_node_children()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete
  IF OLD.deleted_status = 'not_deleted' AND NEW.deleted_status <> 'not_deleted' THEN
    WITH RECURSIVE descendants AS (
      SELECT id FROM "StoryNode" WHERE parent_id = NEW.id
      UNION ALL
      SELECT s.id
      FROM "StoryNode" s
      JOIN descendants d ON s.parent_id = d.id
    )
    UPDATE "StoryNode" sn
    SET deleted_status = 'soft_deleted_by_parent'
    FROM descendants d
    WHERE sn.id = d.id
      AND sn.deleted_status = 'not_deleted';
  END IF;

  -- Restore
  IF OLD.deleted_status <> 'not_deleted' AND NEW.deleted_status = 'not_deleted' THEN
    WITH RECURSIVE descendants AS (
      SELECT id FROM "StoryNode" WHERE parent_id = NEW.id
      UNION ALL
      SELECT s.id
      FROM "StoryNode" s
      JOIN descendants d ON s.parent_id = d.id
    )
    UPDATE "StoryNode" sn
    SET deleted_status = 'not_deleted'
    FROM descendants d
    WHERE sn.id = d.id
      AND sn.deleted_status = 'soft_deleted_by_parent';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_to_soft_deleted_stn_children_when_it_being_soft_deleted ON "StoryNode";

-- CREATE TRIGGER FOR UPDATE STORY NODE CHILDREN STATUS WHEN IT BEING SOFT DELETED
CREATE TRIGGER trigger_to_soft_deleted_stn_children_when_it_being_soft_deleted
AFTER UPDATE OF deleted_status ON "StoryNode"
FOR EACH ROW
WHEN (OLD.deleted_status IS DISTINCT FROM NEW.deleted_status)
EXECUTE FUNCTION handle_soft_deleted_story_node_children();
