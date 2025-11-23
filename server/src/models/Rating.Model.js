import db from "../configs/db.js";

export async function FindAllRatings(where = { id, story_id, user_id }, sort, take = 1, skip = 0) {
  try {
    const ratings = await db.rating.findMany({
      where: {
        is_deleted: false,
        ...where,
      },
      select: {
        id: true,
        story_id: true,
        star: true,
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
      ...(sort && { orderBy: sort }),
      ...(take && { take: take }),
      ...(skip && { skip: skip }),
    });

    return { success: true, data: ratings };
  } catch (error) {
    console.error("❌ [Rating.Model.js] Error finding all ratings: ", error);
    return { success: false, error: error.code };
  }
}

export async function AddRatings(data = { user_id, story_id, star, message }) {
  try {
    if (!data.user_id && !data.story_id && !data.message) return { success: false, data: null };

    const newRating = await db.rating.create({
      data: data,
      select: {
        id: true,
        star: true,
        message: true,
      },
    });
    return { success: true, data: newRating };
  } catch (error) {
    if (error.code !== "P2002") console.error("❌ [Rating.Model.js] Error adding new rating:", error);
    return { success: false, error: error.code };
  }
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
