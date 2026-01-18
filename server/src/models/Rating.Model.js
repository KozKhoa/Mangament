import db from "../configs/db.js";

export async function FindAllRatings({ storyId, userId, star = [[0, 6]], sort = { updated_at: "desc" }, page = 1, limit = 10 }) {
  const where = {
    is_deleted: false,
    ...(storyId && { story_id: storyId }),
    ...(userId && { user_id: userId }),

    OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
  };

  const ratings = await db.rating.findMany({
    where: where,

    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: { select: { url: true, height: true, width: true } },
        },
      },
    },

    orderBy: [sort, { id: "asc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalItems = await db.rating.count({ where: where });

  return {
    success: true,
    data: ratings,
    pagination: {
      page: page,
      pageSize: limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindRating({ id, userId, storyId }) {
  if (!(id || (userId && storyId))) {
    throw new Error("Require id or (user id and story id)");
  }

  const rating = await db.rating.findFirst({ where: { is_deleted: false, id: id } });

  return { success: true, data: rating };
}

export async function AddRatings({ userId, storyId, star, title, content }) {
  if (!userId || !storyId) {
    throw new Error("Require both story id and user id");
  }

  if ((star !== 0 && !star) || !title || !content) {
    throw new Error("Require star, title and content");
  }

  if (typeof star !== "number" || star < 1 || star > 5) {
    throw new Error("star must be a number between 1 and 5");
  }

  return db.$transaction(async (db) => {
    const story = await db.story.findFirst({ where: { id: storyId, is_deleted: false } });
    if (!story) throw new Error("Story not found");

    const user = await db.user.findFirst({ where: { id: userId, is_deleted: false } });
    if (!user) throw new Error("User not found");

    const oldRating = await db.rating.findUnique({ where: { user_id_story_id: { story_id: storyId, user_id: userId } } });
    if (oldRating) throw new Error("Rating already exist");

    const newRating = await db.rating.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        story: {
          connect: {
            id: storyId,
          },
        },
        star: star,
        title: title,
        content: content,
      },
    });

    // Update star for story
    const newStar = (story.star * story.rating_count + star) / (story.rating_count + 1);
    await db.story.update({
      where: { id: storyId },
      data: {
        star: newStar,
        rating_count: story.rating_count + 1,
      },
    });

    delete newRating.is_deleted;

    return { success: true, data: newRating };
  });
}

export async function SoftDeleteRating(where = { id }) {
  try {
    const removing = await db.rating.update({
      where: where,
      data: {
        is_deleted: true,
      },
      select: {
        id: true,
      },
    });
    return { success: true, data: removing };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [Rating.Model.js] Error soft deleting rating:", error);
    return { success: false, error: error.code };
  }
}

export async function HardDeleteRating(where = { id }) {
  try {
    const removing = await db.rating.delete({
      where: where,
      select: {
        id: true,
      },
    });
    return { success: true, data: removing };
  } catch (error) {
    console.error("❌ [Rating.Model.js] Error hard delete rating:", error);
    return { success: false, error: error.code };
  }
}

export async function UpdateRating(where = { id }, data = {}) {
  try {
    const updating = await db.rating.update({
      where: where,
      data: data,
      select: {
        id: true,
        star: true,
        story_id: true,
        message: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: { select: { url: true, width: true, height: true } },
          },
        },
      },
    });

    return { success: true, data: updating };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [Rating.Model.js] Error updating rating:", error);
    return { success: false, error: error.code };
  }
}

export async function CountRating(where = {}) {
  try {
    const count = await db.rating.count({
      where: { is_deleted: false, ...where },
    });

    return { success: true, data: count };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [Rating.Model.js] Error updating rating:", error);
    return { success: false, error: error.code };
  }
}
