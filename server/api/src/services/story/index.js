import * as main from "./main.js";
import * as tree from "./tree.js";
import * as importService from "./import.js";

const storyService = {
  ...main,
  ...tree,
  ...importService,
};

export default storyService;
