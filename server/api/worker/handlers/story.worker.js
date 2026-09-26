/**
 * Barrel / Entrypoint for Story background workers.
 *
 * Workers have been modularized into separate files under ./story/ for clarity,
 * maintainability, and single responsibility:
 *  - story-embedding.worker.js   : AI embedding vector generation
 *  - story-delete.worker.js      : Hard deletion of single / multiple stories
 *  - story-update.worker.js      : Story update & hierarchical tree diffing
 *  - story-batch-import.worker.js: Batch spreadsheet & zip archive processing
 *  - story-sync.worker.js        : Children tree structure synchronization
 */

import { embeddingStoryWorker } from "./story/story-embedding.worker.js";
import { hardDeleteStoryWorker, hardDeleteManyStoriesWorker } from "./story/story-delete.worker.js";
import { updateStoryWorker } from "./story/story-update.worker.js";
import { executeBatchImportRows, batchImportStoriesWorker, batchImportZipWorker } from "./story/story-batch-import.worker.js";
import { syncStoryChildrenWorker } from "./story/story-sync.worker.js";

export {
  embeddingStoryWorker,
  hardDeleteStoryWorker,
  hardDeleteManyStoriesWorker,
  updateStoryWorker,
  executeBatchImportRows,
  batchImportStoriesWorker,
  batchImportZipWorker,
  syncStoryChildrenWorker,
};

export default {
  embeddingStoryWorker,
  hardDeleteStoryWorker,
  hardDeleteManyStoriesWorker,
  updateStoryWorker,
  batchImportStoriesWorker,
  batchImportZipWorker,
  syncStoryChildrenWorker,
};
