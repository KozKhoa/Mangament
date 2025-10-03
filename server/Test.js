import { FindStory, FindAllStories } from "./src/models/Story.Model.js";
import { AddAuthor } from "./src/models/Author.Models.js";

// await AddAuthor({ name: "Khoa" });

// const orderBy = {
//   view: "asc",
// };
// const author = {
//   id: "a2990981-0fa5-4ab7-8a97-35603fb00c88",
// };

const result = await FindStory({
  // id: "d6b0f8bf-0b76-4b16-a039-7083c31c35d5",
  title: "Gen2",
  // type: "manga",
});

console.log(result);
