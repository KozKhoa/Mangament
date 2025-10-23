import db from "../configs/db.js";

export async function FindAllFavouriteStories(
  where = { id, user_id },
  orderBy,
  take = 1,
  skip = 0
) {
  try {
    const favouriteStories = await db.favouriteStory.findMany({
      where: { is_deleted: false, ...where },
      take: take,
      skip: skip,
      ...(orderBy ? { orderBy: orderBy } : { orderBy: { create_at: "desc" } }),
      select: {
        id: true,
        create_at: true,
        user_id: true,
        story: {
          select: {
            id: true,
            title: true,
            star: true,
            view: true,
            cover_art: {
              select: { url: true, width: true, height: true },
            },
          },
        },
      },
    });

    if (!favouriteStories) return { success: false, data: null };
    return { success: true, data: favouriteStories };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error finding all favourite stories:",
      error
    );
    return { success: false, error: error.code };
  }
}

export async function AddFavouriteStory(data = { user_id, story_id }) {
  try {
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
      console.error(
        "❌ [User.Model.js] Error adding new favourite story:",
        error
      );
    return { success: false, error: error.code };
  }
}

export async function HardDeleteFavouriteStory(where = { id }) {
  try {
    const favouriteStory = await db.favouriteStory.delete({ where: where });
    return { success: true, data: favouriteStory };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error hard delete favourite story:",
      error
    );
    return { success: false, error: error.code };
  }
}

export async function SoftDeleteFavouriteStory(where = { id }) {
  try {
    const favouriteStory = await FindAllFavouriteStories({ id: where.id });
    if (!favouriteStory || !favouriteStory.success || !favouriteStory.data)
      return { success: false, data: null };

    const result = await db.favouriteStory.update({
      where: where,
      data: { is_deleted: true },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error soft delete favourite story:",
      error
    );
    return { success: false, error: error.code };
  }
}

export async function UpdateFavouriteStory(where = { id }, data) {
  try {
    const favouriteStory = await FindAllFavouriteStories({ id: where.id });
    if (!favouriteStory || !favouriteStory.success || !favouriteStory.data)
      return { success: false, data: null };

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
