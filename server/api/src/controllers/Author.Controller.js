import ErrorCodes from "../constants/Error.js";
import { AddAuthor, FindAllAuthors, FindAuthor, HardDeleteAuthor, UpdateAuthor } from "../services/author.service.js";

import { CreateError } from "../utils/ErrorHandle.js";

export async function GetAllAuthors(req, res, next) {
  try {
    const page = req.query?.page ? Number(req.query.page) : 1;
    const limit = req.query?.limit ? Number(req.query.limit) : 1;
    const sort = {};

    if (req.query?.sort) {
      const [field, direction] = req.query.sort.split(":");
      sort[field.toLowerCase()] = direction.toLowerCase();
    } else sort["name"] = "asc";

    const authors = await FindAllAuthors({}, sort, limit, (page - 1) * limit);
    if (!authors || !authors.success) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Get authors successfully",
      data: authors.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function PostAuthor(req, res, next) {
  try {
    const userId = req.user.id;

    const authorName = req.body?.name;
    if (!authorName) throw CreateError(400, "'name' for author is require");

    const author = await AddAuthor({ name: authorName });
    if (!author || !author.success) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Add new author successfully",
      data: {
        author: {
          id: author.data.id,
          name: author.data.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function PutAuthor(req, res, next) {
  try {
    const userId = req.user.id;
    const newAuthorName = req.body?.name;
    const authorId = req.params?.id;
    if (!authorId) throw CreateError();
    if (!newAuthorName) throw CreateError(400, "'name' for author is required");

    // Make sure author exist
    const author = await FindAuthor({ id: authorId });
    if (!author || !author.success || !author.data) throw CreateError(404, "Cannot find author");

    const update = await UpdateAuthor({ id: authorId }, { name: newAuthorName });
    if (!update || !update.success) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Update author successfully",
      data: {
        author: {
          id: update.data.id,
          name: update.data.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function DeleteAuthor(req, res, next) {
  try {
    const authorId = req.params?.id;
    if (!authorId) throw CreateError(400, "'id' for author is required");

    const deleting = await HardDeleteAuthor({ id: authorId });
    if (!deleting || !deleting.success) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Delete author successfully",
    });
  } catch (error) {
    next(error);
  }
}
