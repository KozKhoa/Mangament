import db from "../configs/db.js";
import { Genre } from "../configs/db.js";

export function GetAllGenre() {
  return Object.values(Genre);
}

export function ValidateGenre(genres = []) {
  let inputGenres;
  if (Array.isArray(genres)) {
    inputGenres = genres;
  } else {
    inputGenres = [genres];
  }
  const genresSet = new Set(GetAllGenre());

  const validGenres = inputGenres.filter((genre) => genresSet.has(genre));

  return [...new Set(validGenres)];
}

export async function FindAllStoryGenres(where = { story_id }) {
  try {
    const storyGenres = await db.story_Genre.findMany({
      where: where,
      select: {
        story_id: true,
        genre: true,
      },
    });
    return { success: true, data: storyGenres };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function AddManyStoryGenres(data = {}) {
  try {
    const storyGenre = await db.story_Genre.createMany({ data: data });
    return { success: true, data: storyGenre };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function HardDeleteStoryGenre(where = { story_id }) {
  try {
    const deleting = await db.story_Genre.deleteMany({ where: where });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}
