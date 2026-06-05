import crypto from "crypto";

import imageQueue from "../../workers/queues/image.queue.js";

class UploadService {
  async uploadAvatar(userId, file) {
    const id = crypto.randomUUID();

    const key = `user/${userId}/avatar/_avatar_${userId}_${id}.jpg`;

    const url = `${process.env.CDN_URL}/${key}`;

    imageQueue.addJob_AddNewImage({ key, file, resize: { width: 300 }, quality: 80 });

    return { success: true, data: { key, url } };
  }

  async uploadStoryCoverArt(storyId, file) {
    const id = crypto.randomUUID();

    const key = `story/${storyId}/cover-art/_cover-art_${storyId}_${id}.jpg`;

    const url = `${process.env.CDN_URL}/${key}`;

    imageQueue.addJob_AddNewImage({ key, file, resize: { width: 800, withoutEnlargement: true }, quality: 80 });

    return { success: true, data: { key, url } };
  }

  async uploadManyContentsForStoryNode(storyId, storyNodeId, files) {
    let keys = [];
    let urls = [];

    files.forEach(() => {
      const key = `story/${storyId}/story-node/${storyNodeId}/${crypto.randomUUID()}.jpg`;
      const url = `${process.env.CDN_URL}/${key}`;

      keys.push(key);
      urls.push(url);
    });

    imageQueue.addJob_addManyNewImages({ keys, files, resize: { width: 1200, withoutEnlargement: true }, quality: 80 });

    return { success: true, data: { keys, urls } };
  }

  async uploadContentForStoryNode(storyId, storyNodeId, file) {
    const key = `story/${storyId}/story-node/${storyNodeId}/${crypto.randomUUID()}.jpg`;
    const url = `${process.env.CDN_URL}/${key}`;

    imageQueue.addJob_AddNewImage({ key, file, resize: { width: 1200, withoutEnlargement: true }, quality: 80 });

    return { success: true, data: { key, url } };
  }
}

const uploadService = new UploadService();

export default uploadService;
