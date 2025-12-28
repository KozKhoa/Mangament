import db from "../configs/db.js";

export async function FindAllFavouriteStories({
  userId,
  limit = 10,
  page = 1,
  storyType = [],
  authorsId = [],
  genres = [],
  star = [],
  view = [],
  sort = { created_at: "desc" },
}) {
  const favourites = await db.favouriteStory.findMany({
    where: {
      is_deleted: false,
      user_id: userId,
      story: {
        ...(storyType && { type: { in: storyType } }),
        ...(genres && { genres: { hasEvery: genres } }),
        ...(authorsId && {
          authors: { some: { author_id: { in: authorsId } } },
        }),
        AND: [
          {
            OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
          },
          {
            OR: [...view.map(([min, max]) => ({ view: { gte: min, lte: max } }))],
          },
        ],
      },
    },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          star: true,
          view: true,
          type: true,
          cover_art: {
            select: {
              url: true,
              width: true,
              height: true,
            },
          },
        },
      },
    },
    orderBy: [sort, { created_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  return { success: true, data: favourites };
}

export async function FindFavouriesStories({ id }) {
  const favourite = await db.favouriteStory.findUnique({ where: { id: id } });
  return { success: true, data: favourite };
}

export async function AddFavouriteStory(data = { user_id, story_id }) {
  try {
    const isExist = await db.favouriteStory.findFirst({ where: { user_id: data.user_id, story_id: data.story_id } });
    if (isExist) {
      return {
        success: true,
        data: await db.favouriteStory.update({ where: { id: isExist.id }, data: { is_deleted: false } }),
      };
    }

    const favouriteStory = await db.favouriteStory.create({
      data: {
        user: {
          connect: {
            id: data.user_id,
          },
        },
        story: {
          connect: {
            id: data.story_id,
          },
        },
      },
    });

    if (!favouriteStory) return { success: false, data: null };

    return { success: true, data: favouriteStory };
  } catch (error) {
    if (error.code !== "P2002")
      // Unique error => already exist
      console.error("❌ [User.Model.js] Error adding new favourite story:", error);
    return { success: false, error: error.code };
  }
}

export async function HardDeleteFavouriteStory(where = { id }) {
  try {
    const favouriteStory = await db.favouriteStory.delete({ where: where });
    return { success: true, data: favouriteStory };
  } catch (error) {
    console.error("❌ [User.Model.js] Error hard delete favourite story:", error);
    return { success: false, error: error.code };
  }
}

export async function SoftDeleteFavouriteStory({ id, userId }) {
  // Check if exist
  const favourite = await db.favouriteStory.findUnique({ where: { id: id } });
  if (!favourite) return { success: false, message: "Cannot find favourite story" };

  // Check if this favourite belong to user
  if (favourite.user_id !== userId) return { success: false, message: "This favourite story does not belong to this user" };

  // Soft remove
  const softRemove = await db.favouriteStory.update({ where: { id: id }, data: { is_deleted: true } });
  return { success: true, data: softRemove };
}

export async function UpdateFavouriteStory(where = { id }, data) {
  try {
    const favouriteStory = await FindAllFavouriteStories({ id: where.id });
    if (!favouriteStory || !favouriteStory.success || !favouriteStory.data) return { success: false, data: null };

    const updating = await db.favouriteStory.update({
      where: where,
      data: data,
    });
    return { success: true, data: updating };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating favourite story:", error);
    return { success: false, error: error.code };
  }
}
