import * as nationSeeding from "./nations.js";
import * as userSeeding from "./users.js";
import * as storySeeding from "./stories.js";
import * as imageSeeding from "./images.js";
import * as storyNodeSeeding from "./story-nodes.js";
import * as storyGenreSeeding from "./story-genres.js";
import * as storyNodeContentSeeding from "./story-node-contents.js";

await imageSeeding.default();

await userSeeding.default();

await nationSeeding.default();

await storySeeding.default();

// await storyGenreSeeding.default();

// await storyNodeSeeding.default();

// await storyNodeContentSeeding.default();
