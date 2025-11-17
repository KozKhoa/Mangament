import path from "path";

import db from "./src/configs/db.js";

const storyNode = await db.storyNode.findFirst({
  where: { id: "775de99a-fe2f-4f02-b5b3-8e08959c11f6" },
});

const content = storyNode.content;

const arr = new Array(12);

arr.push({ a: "a", b: "b" });

console.log(typeof arr);
console.log(arr);

// console.log(typeof content);
// console.log(content);
