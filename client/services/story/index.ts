import count from "./count";
import get, { getRandomStory, getReview } from "./get";
import { addOneView } from "./patch";

const storyService = { get, getReview, count, addOneView, getRandomStory };

export default storyService;
