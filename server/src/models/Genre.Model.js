import db from "../configs/db.js";
import { Genre } from "../configs/db.js";

export function GetAllGenre() {
  return Object.values(Genre);
}

export function ValidateGenre(genre) {
  if (!genre) return true;
  let returnValue = true;
  const genreList = GetAllGenre();
  if (genre.length > genreList.length) return false;
  const checkDuplicate = {};
  genre.forEach((e) => {
    if (checkDuplicate[e] !== true) checkDuplicate[e] = true;
    else {
      returnValue = false;
      return false;
    }
    if (!genreList.includes(e)) {
      returnValue = false;
      return false;
    }
  });
  return returnValue;
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
    console.error("❌ [Genre.Model.js] Error finding all story genres:", error);
    return { success: false, error: error.code };
  }
}

export async function AddManyStoryGenres(data = {}) {
  try {
    const storyGenre = await db.story_Genre.createMany({ data: data });
    return { success: true, data: storyGenre };
  } catch (error) {
    console.error("❌ [Genre.Model.js] Error adding story genre:", error);
    return { success: false, error: error.code };
  }
}

export async function HardDeleteStoryGenre(where = { story_id }) {
  try {
    const deleting = await db.story_Genre.deleteMany({ where: where });
    return { success: true };
  } catch (error) {
    console.error("❌ [Genre.Model.js] Error hadrd deleting story genre:", error);
    return { success: false, error: error.code };
  }
}
