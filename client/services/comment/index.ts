import { getStoryComments, getStoryNodeComments, countStoryComment, countStoryNodeComment } from "./get";
import { postStoryComment, postStoryNodeComment } from "./post";

const commentService = { getStoryComments, getStoryNodeComments, countStoryComment, countStoryNodeComment, postStoryComment, postStoryNodeComment };

export default commentService;
