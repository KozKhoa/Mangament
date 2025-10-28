import path from "path";

console.log(path.join("a/b/c", Date.now() + path.extname("hello.txt")));
