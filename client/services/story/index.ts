import count from "./count";
import get, { getReview } from "./get";
import { addOneView } from "./patch";

const storyService = { get, getReview, count, addOneView };

export default storyService;
