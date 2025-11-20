import * as genreModel from "../models/Genre.Model.js";

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
