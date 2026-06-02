-- Function to handle hard delete
CREATE OR REPLACE FUNCTION handle_hard_deleted_story_node()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if the node wasn't already soft-deleted 
  -- (If it was soft-deleted, count was already decremented by the update trigger)
  IF OLD.deleted_status = 'not_deleted'  THEN
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