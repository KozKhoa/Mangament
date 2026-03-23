import * as genreModel from "../models/Genre.Model.js";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";

export async function GetAllGenre(req, res, next) {
  try {
    const genres = genreModel.GetAllGenre();

    return res.status(200).json({
      success: true,
      message: "Get all genres successfully",
      data: genres,
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
