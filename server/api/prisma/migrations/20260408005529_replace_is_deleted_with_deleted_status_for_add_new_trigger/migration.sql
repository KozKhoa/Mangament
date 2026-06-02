

CREATE OR REPLACE FUNCTION handle_add_new_story_node()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase count for story (only incr if this node is direct child of story)
  IF NEW.story_id IS NOT NULL AND NEW.parent_id IS NULL AND NEW.deleted_status = 'not_deleted' THEN
    UPDATE "Story"
    SET number_of_children = number_of_children + 1
    WHERE id = NEW.story_id;
  END IF;

  -- Increase count for parent node
  IF NEW.parent_id IS NOT NULL AND NEW.deleted_status = 'not_deleted' THEN
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


