import db from "../../../configs/db.js";
import { redis } from "../../../configs/redis.js";
import { CreateError } from "../../utils/ErrorHandle.js";
import { randomInt } from "../../utils/Number.js";
import { validate as isUUID } from "uuid";
import redisUtils, { redisTTL } from "../../utils/Redis.js";
import { STORY_SEARCH_SIMILARITY } from "../../constants/Story.js";
import mailService from "../mail.service.js";
import { ResolveOrCreateImage } from "../image.service.js";
import { BuildStoryTree } from "./tree.js";

export { ResolveOrCreateImage };

const DEFAULT_SELECT_STORY_COLUMNS = {
  id: true,
  title: true,
  other_titles: true,
  type: true,
  view: true,
  star: true,
  status: true,
  summary: true,

  is_actived: true,
  deleted_status: true,

  created_at: true,
  updated_at: true,

  authors: { select: { author: { select: { id: true, name: true } } } },
  genres: { select: { genre: { select: { name: true } } } },
  cover_art: { select: { id: true, path: true, size: true, height: true, width: true } },
  nation: { select: { name: true, flag_icon: true } },
};

export async function GetReview(storyId, number = 1) {
  const storyVer = await redisUtils.stories(storyId).get();

  const REDIS_KEY = ["GetReview:", "storyVer=" + storyVer, "storyId=" + storyId, "number=" + number].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const storyNodes = await db.storyNode.findMany({ where: { story_id: storyId, type: "chapter" } });

  const randomReviews = [];
  for (let i = 0; i < number; i++) {
    randomReviews.push(storyNodes.at(randomInt(0, storyNodes.length - 1)));
  }

  const unique = new Set(randomReviews);

  await redis.setex(REDIS_KEY, 3600, JSON.stringify([...unique]));

  return [...unique];
}

export async function FindAllStories({
  title,
  genres = [],
  authors = [],
  nations = [],
  types = [],
  status = [],
  banned = false,

  star = 0,
  views = 0,

  createdFromDate = null,
  createdToDate = null,

  isGettingNewestChapter = false,
  isGettingDeletedStories = false,
  isGettingUnActiveStories = false,

  limit = 10,
  page = 1,
  sort = { updated_at: "desc" },
}) {
  const globalStoriesVer = await redisUtils.stories().get();

  const REDIS_KEY = [
    "FindAllStories",
    "globalStoriesVer=" + globalStoriesVer,
    "title=" + title,
    "genres=" + genres?.join(","),
    "authors=" + authors?.join(","),
    "nations=" + nations?.join(","),
    "types=" + types?.join(","),
    "status=" + status?.join(","),

    "banned=" + banned,

    "star=" + star,
    "views=" + views,

    "createdFromDate=" + createdFromDate,
    "createdToDate=" + createdToDate,

    "isGettingNewestChapter=" + isGettingNewestChapter,

    "isGettingDeletedStories=" + isGettingDeletedStories,
    "isGettingUnActiveStories=" + isGettingUnActiveStories,

    "limit=" + limit,
    "page=" + page,

    "sort=" + JSON.stringify(sort),
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  let fullTextSearchStoryIds = [];
  if (title) {
    const rawMatches = await db.$queryRaw`
      SELECT id
      FROM "Story"
      WHERE similarity(title, ${title}) >= ${STORY_SEARCH_SIMILARITY}
        OR EXISTS (
          SELECT 1
          FROM unnest(other_titles) AS ot
          WHERE similarity(ot, ${title}) >= ${STORY_SEARCH_SIMILARITY}
        );
    `;

    fullTextSearchStoryIds = rawMatches.map((story) => story.id);
  }

  const sortField = Object.keys(sort)[0] || "updated_at";
  const sortOrder = Object.values(sort)[0] || "desc";

  const pageInt = Math.max(1, parseInt(page, 10) || 1);
  const limitInt = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageInt - 1) * limitInt;

  const whereCondition = {
    ...(title && { id: { in: fullTextSearchStoryIds } }),

    ...(isGettingDeletedStories === false && { deleted_status: "not_deleted" }),
    ...(isGettingUnActiveStories === false && { is_actived: true }),

    star: { gte: Number(star ?? 0) },

    view: { gte: Number(views ?? 0) },

    ...(banned === false && { poster: { is_banned: false } }),

    ...(types?.length > 0 && { type: { in: types } }),

    ...(status?.length > 0 && { status: { in: status } }),

    ...(genres?.length > 0 && {
      genres: {
        some: {
          genre: {
            name: { in: genres },
          },
        },
      },
    }),

    ...(authors?.length > 0 && {
      authors: {
        some: {
          author: {
            name: { in: authors },
          },
        },
      },
    }),

    ...(nations?.length > 0 && {
      nation: {
        name: { in: nations },
      },
    }),

    ...((createdFromDate || createdToDate) && {
      created_at: {
        ...(createdFromDate && { gte: new Date(createdFromDate) }),
        ...(createdToDate && { lte: new Date(createdToDate) }),
      },
    }),
  };

  const [totalItems, stories] = await Promise.all([
    db.story.count({ where: whereCondition }),
    db.story.findMany({
      where: whereCondition,
      select: {
        ...DEFAULT_SELECT_STORY_COLUMNS,
      },

      orderBy: {
        [sortField]: sortOrder,
      },

      take: limitInt,
      skip: skip,
    }),
  ]);

  const mapData = stories.map((story) => ({
    ...story,

    authors: story.authors.map((a) => a.author),

    genres: story.genres.map((g) => g.genre.name),

    nation: story.nation,
  }));

  const totalPages = Math.ceil(totalItems / limitInt);

  const result = {
    success: true,
    data: mapData,
    pagination: {
      page: pageInt,
      limit: limitInt,
      totalItems,
      totalPages,
    },
  };

  await redis.setex(REDIS_KEY, 3600, JSON.stringify(result));

  return result;
}

export async function FindStory({ id, isGettingChildren = false, isGettingContent = false, isGettingTrashNode = false, isGettingTrashContent = false }) {
  const storyVer = await redisUtils.stories(id).get();
  const storyNodeVer = await redisUtils.storyNodes(id).get();

  const REDIS_KEY = [
    "FindStory",
    "storyVer=" + storyVer,
    "storyNodeVer=" + storyNodeVer,

    "id=" + id,

    "isGettingChildren=" + isGettingChildren,
    "isGettingContent=" + isGettingContent,
    "isGettingTrashNode=" + isGettingTrashNode,

    "isGettingTrashContent=" + isGettingTrashContent,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);

  if (cached) return JSON.parse(cached);

  const isGettingTree = isGettingChildren || isGettingContent || isGettingTrashNode || isGettingTrashContent;

  const story = await db.story.findUnique({
    where: {
      ...(isUUID(id) ? { id } : { title: id }),
    },
    select: {
      ...DEFAULT_SELECT_STORY_COLUMNS,
    },
  });

  if (!story) throw CreateError(404, "Story not found");

  const formattedResult = {
    ...story,

    authors: story.authors.map((a) => a.author),

    genres: story.genres.map((g) => g.genre.name),

    children: isGettingTree
      ? await BuildStoryTree(story.id, null, {
          isGettingContent,
          isGettingTrashNode,
          isGettingTrashContent,
        })
      : story.children,
  };

  const result = {
    success: true,
    data: formattedResult,
  };

  await redis.setex(REDIS_KEY, 3600, JSON.stringify(result));

  return result;
}

export async function FindRandomStory() {
  const randomStory = await db.$queryRaw`
    SELECT id, title, type 
    FROM "Story" 
    WHERE is_actived = true AND deleted_status = 'not_deleted' 
    ORDER BY RANDOM() 
    LIMIT 1;
  `;

  return randomStory?.at(0) ?? null;
}

export async function AddStory({ title, otherTitles, type, nation, genres, authorIds, status, posterId, summary, coverArt }) {
  const existedStory = await db.story.findUnique({ where: { title } });
  if (existedStory) throw CreateError(400, "Story title already exists");

  const validNation = nation
    ? await db.nation.findFirst({
        where: {
          OR: [{ name: nation.name }, { flag_icon: nation.flag_icon }],
        },
      })
    : null;

  const validGenres = genres?.length
    ? await db.genre.findMany({
        where: { name: { in: genres } },
      })
    : [];

  const validAuthors = authorIds?.length
    ? await db.author.findMany({
        where: { id: { in: authorIds } },
      })
    : [];

  const coverArtResult = coverArt ? await ResolveOrCreateImage(coverArt) : null;

  const newStory = await db.story.create({
    data: {
      title,

      ...(otherTitles && { other_titles: otherTitles }),

      ...(type && { type }),

      ...(status && { status }),

      ...(summary && { summary }),

      ...(posterId && { poster: { connect: { id: posterId } } }),

      ...(validNation && { nation: { connect: { id: validNation.id } } }),

      ...(coverArtResult && { cover_art: { connect: { id: coverArtResult.id } } }),

      ...(validGenres.length > 0 && {
        genres: {
          createMany: {
            data: validGenres.map((g) => ({ genre_id: g.id })),
          },
        },
      }),

      ...(validAuthors.length > 0 && {
        authors: {
          createMany: {
            data: validAuthors.map((a) => ({ author_id: a.id })),
          },
        },
      }),
    },

    select: {
      ...DEFAULT_SELECT_STORY_COLUMNS,
    },
  });

  const formattedResult = {
    ...newStory,

    authors: newStory.authors.map((a) => a.author),

    genres: newStory.genres.map((g) => g.genre.name),

    children: [],
  };

  await redisUtils.stories().incr();

  return formattedResult;
}

export async function ToggleSoftDeleteStory(id, deletedStatus = "not_deleted") {
  const isDelete = deletedStatus !== "not_deleted";

  const updatedStory = await db.story.update({
    where: { id: id },
    data: {
      deleted_status: deletedStatus,
      story_nodes: {
        updateMany: {
          where: {},
          data: {
            deleted_status: isDelete ? "soft_deleted_by_parent" : "not_deleted",
          },
        },
      },
    },
  });

  await redisUtils.stories(id).incr();
  await redisUtils.storyNodes(id).incr();

  return updatedStory;
}

export async function ToggleSoftDeleteManyStories(ids = [], deletedStatus = "not_deleted") {
  if (!ids || ids.length === 0) return { count: 0 };

  const isDelete = deletedStatus !== "not_deleted";

  const result = await db.story.updateMany({
    where: { id: { in: ids } },
    data: {
      deleted_status: deletedStatus,
    },
  });

  await db.storyNode.updateMany({
    where: { story_id: { in: ids } },
    data: {
      deleted_status: isDelete ? "soft_deleted_by_parent" : "not_deleted",
    },
  });

  await redisUtils.stories().incr();

  return result;
}

export async function HardDeleteStory(id) {
  const deletedStory = await db.story.delete({
    where: { id: id },
  });

  await redisUtils.stories(id).incr();
  await redisUtils.storyNodes(id).incr();

  return deletedStory;
}

export async function HardDeleteManyStories(ids = []) {
  if (!ids || ids.length === 0) return { count: 0 };

  const result = await db.story.deleteMany({
    where: { id: { in: ids } },
  });

  await redisUtils.stories().incr();

  return result;
}

export async function ActiveStory(id, isActived = true) {
  const updatedStory = await db.story.update({
    where: { id: id },
    data: {
      is_actived: isActived,
    },
  });

  await redisUtils.stories(id).incr();

  return updatedStory;
}

export async function UpdateStory(id, { title, otherTitles, type, view, summary, posterId, nation, status, genres, coverArt, nextChapterIn, authorIds }) {
  if (authorIds && authorIds.length > 0) {
    for (const authorId of authorIds) {
      if (!isUUID(authorId)) throw CreateError(400, "authorIds must be uuid[]");
    }
  }

  if (otherTitles && otherTitles.length > 0) {
    otherTitles = [...new Set(otherTitles.map((t) => t.trim()))];
  }

  const story = await db.story.findUnique({ where: { id: id }, select: { id: true } });
  if (!story) throw CreateError(400, "Story not found");

  const updatedStory = await db.$transaction(async (tx) => {
    if (genres !== undefined) {
      await tx.story_Genre.deleteMany({ where: { story_id: id } });

      const genresId = (await tx.genre.findMany({ where: { name: { in: genres } }, select: { id: true } })).map((genre) => genre.id);

      if (genresId.length > 0) {
        await tx.story_Genre.createMany({
          data: genresId.map((genreId) => ({
            story_id: id,
            genre_id: genreId,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (authorIds !== undefined) {
      await tx.story_Author.deleteMany({ where: { story_id: id } });

      if (authorIds.length > 0) {
        await tx.story_Author.createMany({
          data: authorIds.map((authorId) => ({
            story_id: id,
            author_id: authorId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const select = {
      id: true,
      ...(title && { title: true }),
      ...(otherTitles && { other_titles: true }),
      ...(type && { type: true }),
      ...(view && { view: true }),
      ...(summary && { summary: true }),
      ...(status && { status: true }),
      ...(nextChapterIn && { next_chapter_in: true }),
      ...(nation && { nation: { select: { id: true, name: true, flag_icon: true } } }),
      ...(coverArt && { cover_art: { select: { id: true, path: true, provider: true, height: true, width: true, size: true } } }),
      ...(posterId && { poster_id: true }),
      ...(genres && { genres: { select: { genre: { select: { id: true, name: true } } } } }),
      ...(authorIds && { authors: { select: { author: { select: { id: true, name: true } } } } }),
    };

    let imageConnectId = null;
    if (coverArt) {
      imageConnectId = await ResolveOrCreateImage(coverArt, tx);
    }

    const updated = await tx.story
      .update({
        where: { id: id },
        data: {
          ...(title && { title: title }),
          ...(otherTitles && { other_titles: otherTitles }),
          ...(type && { type: type }),
          ...(view && { view: view }),
          ...(summary && { summary: summary }),
          ...(status && { status: status }),
          ...(nextChapterIn && { next_chapter_in: nextChapterIn }),
          ...(nation && { nation: { connect: { name: nation } } }),
          ...(imageConnectId && { cover_art: { connect: { id: imageConnectId } } }),
          ...(posterId && { poster: { connect: { id: posterId } } }),
        },
        select,
      })
      .catch(async (error) => {
        const uniqueTitle = title ? await db.story.findUnique({ where: { title: title } }) : undefined;
        if (uniqueTitle && uniqueTitle.id !== id) throw CreateError(400, `'${title}' đã có người đăng ký`);

        throw error;
      });

    if (updated.genres) {
      updated.genres = updated.genres.map((g) => g.genre.name);
    }
    if (updated.authors) {
      updated.authors = updated.authors.map((a) => a.author);
    }

    return updated;
  });

  await redisUtils.stories(id).incr();
  await redisUtils.stories().incr();

  mailService.sendNotificationToUsersWhenStoryUpdated(id);

  return { success: true, message: "Update story successfully", data: updatedStory };
}

export async function UpdateStoryCoverArt(storyId, coverArt) {
  const updateStory = await db.story
    .update({
      where: { id: storyId },
      data: {
        ...(coverArt && {
          cover_art: coverArt.id
            ? { connect: { id: coverArt.id } }
            : {
                connectOrCreate: {
                  where: { path: coverArt?.path || coverArt?.key || coverArt?.url },
                  create: {
                    path: coverArt?.path || coverArt?.key || coverArt?.url,
                    provider: coverArt?.provider || "local",
                    mine_type: coverArt?.mine_type || "image/jpeg",
                    width: coverArt?.width ? Number(coverArt.width) : null,
                    height: coverArt?.height ? Number(coverArt.height) : null,
                    size: coverArt?.size ? Number(coverArt.size) : 0,
                  },
                },
              },
        }),
      },
    })
    .catch(async (error) => {
      const story = await db.story.findUnique({ where: { id: storyId } });
      if (!story) throw CreateError(404, "Story not found");

      throw new Error(error);
    });

  await redisUtils.stories(storyId).incr();
  return updateStory;
}

export async function AddOneViewForStory(id) {
  const updatedStory = await db.story.update({
    where: { id: id },
    data: {
      view: { increment: 1 },
    },
  });

  await redisUtils.stories(id).incr();

  return updatedStory;
}

export async function GetRecommendStories({ storyId, userId, page = 1, limit = 10 }) {
  const storiesVer = await redisUtils.stories().get();

  const REDIS_KEY = ["GetRecommendStories", "storiesVer=" + storiesVer, "storyId=" + storyId, "userId=" + userId, "page=" + page, "limit=" + limit].join(":");

  const cached = await redis.get(REDIS_KEY);

  let ids;

  if (cached) {
    ids = JSON.parse(cached);
  } else {
    const story = (
      await db.$queryRaw`
    SELECT id, embedding::text
    FROM "Story"
    WHERE id::uuid = ${storyId}::uuid AND deleted_status = 'not_deleted' AND is_actived = true
    LIMIT 1
  `
    )[0];

    if (!story) {
      const targetStory = await db.story.findUnique({
        where: { id: storyId },
        select: {
          genres: { select: { genre_id: true } },
          authors: { select: { author_id: true } },
          type: true,
        },
      });

      if (!targetStory) {
        throw CreateError(404, "Story not found");
      }

      const genreIds = targetStory.genres.map((g) => g.genre_id);
      const authorIds = targetStory.authors.map((a) => a.author_id);
      const limitInt = Math.max(1, parseInt(limit, 10) || 10);
      const pageInt = Math.max(1, parseInt(page, 10) || 1);
      const skip = (pageInt - 1) * limitInt;

      const whereCondition = {
        id: { not: storyId },
        is_actived: true,
        deleted_status: "not_deleted",
        OR: [{ genres: { some: { genre_id: { in: genreIds } } } }, { authors: { some: { author_id: { in: authorIds } } } }, { type: targetStory.type }],
      };

      const [totalItems, stories] = await Promise.all([
        db.story.count({ where: whereCondition }),
        db.story.findMany({
          where: whereCondition,
          select: DEFAULT_SELECT_STORY_COLUMNS,
          orderBy: [{ star: "desc" }, { view: "desc" }],
          take: limitInt,
          skip,
        }),
      ]);

      const mapData = stories.map((s) => ({
        ...s,
        authors: s.authors.map((a) => a.author),
        genres: s.genres.map((g) => g.genre.name),
        nation: s.nation,
      }));

      return {
        stories: mapData,
        pagination: { page: pageInt, limit: limitInt, totalItems, totalPages: Math.ceil(totalItems / limitInt) },
      };
    }

    ids = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL ivfflat.probes = 100`;

      const recommendStory = await tx.$queryRaw`
        SELECT id,
              1 - (embedding <=> ${story.embedding}::vector) AS similarity
        FROM "Story"
        WHERE id::uuid != ${story.id}::uuid AND deleted_status = 'not_deleted' AND is_actived = true
        ORDER BY embedding <=> ${story.embedding}::vector
        LIMIT ${limit}
      `;

      return recommendStory.map((item) => item.id);
    });
  }

  await redis.setex(REDIS_KEY, redisTTL.getRecommendStories || 3600, JSON.stringify(ids));

  const stories = await db.story.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      type: true,
      view: true,
      star: true,
      cover_art: { select: { id: true, path: true, width: true, height: true } },
    },
  });

  return { success: true, data: stories };
}
