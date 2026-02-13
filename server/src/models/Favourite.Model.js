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
  sort = { updated_at: "desc" },
}) {
  const where = {
    is_deleted: false,
    user_id: userId,
    story: {
      ...(storyType && { type: { in: storyType } }),
      ...(genres &&
        genres.length > 0 && {
          genres: {
            some: {
              genre: {
                in: genres,
              },
            },
          },
        }),
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
  };

  const favourites = await db.favouriteStory.findMany({
    where: where,
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
    orderBy: [sort, { updated_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalItems = await db.favouriteStory.count({ where: where });

  return {
    success: true,
    data: favourites,
    pagination: {
      page: page,
      pageSize: favourites.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindFavouriteStory({ id, userId, storyId }) {
  const favourite = await db.favouriteStory.findUnique({
    where: {
      is_deleted: false,
      ...(id && { id: id }),
      ...(userId &&
        storyId && {
          user_id_story_id: {
            user_id: userId,
            story_id: storyId,
          },
        }),
    },
  });
  return { success: true, data: favourite };
}

export async function AddFavouriteStory({ userId, storyId }) {
  // Is story exist
  const isStoryExist = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
  if (!isStoryExist) throw new Error("Story not found");

  const favourite = await db.favouriteStory.upsert({
    where: { user_id_story_id: { user_id: userId, story_id: storyId } },
    create: { user: { connect: { id: userId } }, story: { connect: { id: storyId } } },
    update: { is_deleted: false, updated_at: new Date() },
  });

  return { success: true, data: favourite };
}

export async function HardDeleteFavouriteStory({ id }) {
  if (!id) throw new Error("Require id");

  const hardRemove = await db.favouriteStory.deleteMany({ where: { id: id } });

  return { success: true, message: "Remove permanently" };
}

export async function SoftDeleteFavouriteStory({ id, userId }) {
  if (!id || !userId) throw new Error("Require favourite id and user id");

  const softRemove = await db.favouriteStory.update({ where: { id: id, user_id: userId }, data: { is_deleted: true } });

  return { success: true, data: softRemove };
}
