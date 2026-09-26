import * as nationSeeding from "./nations.js";
import * as userSeeding from "./users.js";
// import * as imageSeeding from "./images.js";
// import * as genreSeeding from "./genre.js";

// await imageSeeding.default();

await nationSeeding.default();

// await genreSeeding.default();

await userSeeding.default();

process.exit(0);
