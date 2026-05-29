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

// POST /genres
/**
 *
 * @param {{
 *    userId: string,
 *    body: {
 *      genres: Array<string>,
 *      descriptions?: Array<string>,
 *      thumbnails?: Array<{
 *        url?: string,
 *        key: string
 *      }>
 *    }
 * }} req
 * @param {*} res
 * @param {*} next
 */
export async function PostManyGenres(req, res, next) {
  try {
    const { genres, descriptions, thumbnails } = req.body;

    if (!genres) throw CreateError(400, "'genres' are required");

    const result = await genreService.AddManyGenres(genres, descriptions, thumbnails);

    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
}
