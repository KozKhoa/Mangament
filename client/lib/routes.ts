export const routes = {
  storyNode: (params?: { storyType?: string; storyId?: string; storyNodeType?: string; storyNodeId?: string }) => {
    // Format: stories/storyType/storyId/storyNodeType/storyNodeId
    const dir: string[] = ["/stories"];

    if (params?.storyType) dir.push(params.storyType);
    if (params?.storyId) dir.push(params.storyId);
    if (params?.storyNodeType) dir.push(params.storyNodeType);
    if (params?.storyNodeId) dir.push(params.storyNodeId);

    return dir.join("/");
  },

  story: (params?: { storyType?: string; storyId?: string }) => {
    // Format: stories/storyType/storyId
    const dir: string[] = ["/stories"];

    if (params?.storyType) dir.push(params.storyType);
    if (params?.storyId) dir.push(params.storyId);

    return dir.join("/");
  },

  genre: (params?: { genre?: string }) => {
    // Format: genres/genre
    const dir: string[] = ["/genre"];

    if (params?.genre) dir.push(params.genre);

    return dir.join("/");
  },

  ranking: (params?: { storyType?: string }) => {
    // Format: ranking/storyType
    const dir: string[] = ["/ranking"];

    if (params?.storyType) dir.push(params.storyType);

    return dir.join("/");
  },

  history: () => {
    return "/histories";
  },

  favourite: () => {
    return "/favourite";
  },
};
