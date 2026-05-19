import * as genreService from "../services/genre.service.js";

import { CreateError } from "../utils/ErrorHandle.js";

// GET /genres
export async function GetAllGenres(req, res, next) {
  try {
    const genres = await genreService.GetAllGenres();

    return res.status(200).json({
      success: true,
      message: "Get all genres successfully",
      data: genres.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function AddNewGenre(req, res, next) {
  try {
    const newGenres = req?.body?.genres;

    if (genres) throw CreateError(400, "'genres' are required");
  } catch (err) {
    next(err);
  }
}
