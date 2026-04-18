import StoryNode, { StoryNodeContent } from "@/types/story-node";

/**
 * Interface representing the result of a comparison.
 */
export interface StoryNodeDiffResult {
  isChanged: boolean;
  changes: {
    title?: boolean;
    type?: boolean;
    order_index?: boolean;
    deleted_status?: boolean;
    content?: boolean;
    children?: boolean;
  };
}

/**
 * Checks if two StoryNodeContent objects are different.
 */
export function isStoryNodeContentChanged(content1: StoryNodeContent, content2: StoryNodeContent): boolean {
  if (content1.type !== content2.type) return true;
  if (content1.order_index !== content2.order_index) return true;
  if (content1.content !== content2.content) return true;
  if (content1.deleted_status !== content2.deleted_status) return true;

  // Compare images
  const image1 = content1.image;
  const image2 = content2.image;
  if (!!image1 !== !!image2) return true;
  if (image1 && image2 && (image1.id !== image2.id || image1.url !== image2.url)) return true;

  // Check for local file changes
  if (content1.imageFile !== content2.imageFile) return true;

  return false;
}

/**
 * Checks if two StoryNode objects are different, including nested content and children.
 * Returns a boolean indicating if any relevant field has changed.
 */
export function isStoryNodeChanged(node1: StoryNode, node2: StoryNode): boolean {
  return compareStoryNodes(node1, node2).isChanged;
}

/**
 * Performs a detailed comparison between two StoryNode objects.
 */
export function compareStoryNodes(node1: StoryNode, node2: StoryNode): StoryNodeDiffResult {
  const changes: StoryNodeDiffResult["changes"] = {
    title: node1.title !== node2.title,
    type: node1.type !== node2.type,
    order_index: node1.order_index !== node2.order_index,
    deleted_status: node1.deleted_status !== node2.deleted_status,
  };

  // Compare content arrays
  const content1 = node1.content || [];
  const content2 = node2.content || [];
  changes.content = content1.length !== content2.length;

  if (!changes.content) {
    for (let i = 0; i < content1.length; i++) {
      if (isStoryNodeContentChanged(content1[i], content2[i])) {
        changes.content = true;
        break;
      }
    }
  }

  // Compare children arrays recursively
  const children1 = node1.children || [];
  const children2 = node2.children || [];
  changes.children = children1.length !== children2.length;

  if (!changes.children) {
    for (let i = 0; i < children1.length; i++) {
      if (isStoryNodeChanged(children1[i], children2[i])) {
        changes.children = true;
        break;
      }
    }
  }

  const isChanged = Object.values(changes).some((v) => v === true);

  return { isChanged, changes };
}

/**
 * Returns an object containing only the fields that have changed.
 */
export function getStoryNodeChanges(original: StoryNode, current: StoryNode): Partial<StoryNode> {
  const { changes } = compareStoryNodes(original, current);
  const diff: Partial<StoryNode> = {};

  if (changes.title) diff.title = current.title;
  if (changes.type) diff.type = current.type;
  if (changes.order_index) diff.order_index = current.order_index;
  if (changes.deleted_status) diff.deleted_status = current.deleted_status;
  if (changes.content) diff.content = current.content;
  if (changes.children) diff.children = current.children;

  return diff;
}
