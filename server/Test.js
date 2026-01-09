import path from "path";

import db from "./src/configs/db.js";
import { UpdateStory } from "./src/models/Story.Model.js";

async function name() {
  const stories = await db.story.findMany({ take: 1000, include: { genres: { select: { genre: true } } } });

  for (const story of stories) {
    const update = await UpdateStory(story.id, {
      genres: [
        "action",
        "romance",
        "action",
        "adventure",
        "comedy",
        "crime",
        "cyberpunk",
        "dark_fantasy",
        "detective",
        "drama",
        "dystopian_fiction",
        "ecchi",
        "fairy_tale",
        "fantasy",
        "fiction",
        "gekiga",
        "gothic_fiction",
        "harem",
        "high_fantasy",
        "historical",
        "historical_fiction",
        "horror",
        "isekai",
        "josei",
        "kodomo",
        "literary_fiction",
        "low_fantasy",
        "magical_realism",
        "martial_arts",
        "mecha",
        "mystery",
        "parody",
        "post_apocalyptic",
        "psychology",
        "romance",
        "science_fiction",
        "seinen",
        "shojo",
        "shonen",
        "shoujo_ai",
        "shounen_ai",
        "slice_of_life",
        "space_opera",
        "sport",
        "steampunk",
        "supernatural",
        "survival",
        "thriller",
        "tragedy",
        "yaoi",
        "yuri",
      ],
    });
  }
}

await name();
