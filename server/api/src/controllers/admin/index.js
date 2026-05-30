import * as user from "./user.controller.js";
import * as story from "./story.controller.js";
import * as image from "./image.controller.js";
import * as storyNode from "./story-node.controller.js";
import * as dashboard from "./dashboard.controller.js";

const adminController = { dashboard, user, story, image, storyNode };

export default adminController;
