import db from "../../configs/db.js";
import { redis } from "../../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { randomInt } from "../utils/Number.js";
import { ValidateGenre } from "./genre.service.js";

import storyQueue from "../../queues/story.queue.js";

import { throwErrorIfInvalidGenres } from "../utils/Validators.js";

import { validate as isUUID } from "uuid";
import redisUtils from "../utils/Redis.js";

import { STORY_SEARCH_SIMILARITY } from "../constants/Story.js";

const REDIS_TTL = 60 * 30; // 30 minutes

const OTHER_TITLES_SEPARATOR = ";";

export async function BuildStoryTree(storyId, storyNodeId, isGettingContent = false) {
  const storiesVer = await redisUtils.stories(storyId).get();
  const storyNodeVer = await redisUtils.storyNodes(storyId).get();

  const REDIS_KEY = [
    "BuildStoryTree",
    "storiesVer=" + storiesVer,
    "storyNodeVer=" + storyNodeVer,
    "storyId=" + storyId,
    "storyNodeId=" + storyNodeId,
    "isGettingContent=" + isGettingContent,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);

  if (cached) return JSON.parse(cached);

  const storyNodes = await db.storyNode.findMany({
    where: {
      deleted_status: "not_deleted",
      story: {
        is: { id: storyId, deleted_status: "not_deleted" },
      },
      ...(storyNodeId && { parent_id: storyNodeId }),
    },
    include: {
      ...(isGettingContent && {
        content: {
          where: { deleted_status: "not_deleted" },
          include: { image: { where: { deleted_status: "not_deleted" } } },
          orderBy: { order_index: "asc" },
        },
      }),
    },

    orderBy: { order_index: "asc" },
  });

  const map = new Map();
  for (const node of storyNodes) {
    map.set(node.id, { ...node, children: [] });
  }

  const tree = [];
  for (const node of map.values()) {
    if (node.parent_id) {
      map.get(node.parent_id)?.children.push(node);
    } else {
      tree.push(node);
    }
  }

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(tree));

  return tree;
}

export async function GetNewestChapter(storyId, number) {
  const storyVer = await redisUtils.stories(storyId).get();

  const REDIS_KEY = ["GetNewestChapter", "storyVer=" + storyVer, "storyId=" + storyId, "number=" + number].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  let count = 0;
  const dfs = async (parentId) => {
    const nodes = await db.storyNode.findMany({
      where: {
        parent_id: parentId,
        story_id: storyId,
      },
      orderBy: {
        order_index: "desc",
      },
      select: {
        id: true,
        title: true,
        order_index: true,
        story_id: true,
        parent_id: true,
        type: true,
        created_at: true,
        updated_at: true,
      },
    });

    const result = [];
    for (const node of nodes) {
      if (count >= number) break;
      result.push(node);

      if (node.type !== "chapter") {
        node.children = await dfs(node.id);
      } else if (node.type === "chapter") {
        node.children = [];
        count++;
      }
    }

    return result;
  };

  const result = await dfs(null);

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function GetReview(storyId, number = 1) {
  const storyVer = await redisUtils.stories(storyId).get();

  const REDIS_KEY = ["GetReview:", "storyVer=" + storyVer, "storyId=" + storyId, "number=" + number].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const storyNodes = await db.storyNode.findMany({ where: { story_id: storyId, type: "chapter" } });

  const storyNodeContents = await db.storyNodeContent.findMany({
    where: { story_node_id: { in: storyNodes.map((node) => node.id) } },
    select: { image: { select: { key: true, url: true, width: true, height: true } } },
    take: number,
  });

  const result = { success: true, data: storyNodeContents.map((content) => content.image) };

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindAllStories({
  page = 1,
  limit = 10,
  sort = { updated_at: "desc" },
  keyword,
  type = [],
  view = [[0, 2147483647]],
  star = [[0, 6]],
  genres = [],
  nation = [],
  authorsId = [],
  status = [],
  isActived,
  deletedStatus = "not_deleted",
  isGettingChildren = false,
  isGettingNewestChapter = false,
}) {
  const storiesVer = await redisUtils.stories().get();

  const REDIS_KEY = [
    "FindAllStories",
    "storiesVer=" + storiesVer,
    "page=" + page,
    "limit=" + limit,
    "sort=" + JSON.stringify(sort),
    "isActived=" + isActived,
    "deletedStatus=" + deletedStatus,
    "keyword=" + keyword,
    "type=" + type,
    "view=" + view,
    "star=" + star,
    "genre=" + genres,
    "nation=" + nation,
    "authorsId=" + authorsId,
    "status=" + status,
    "isGettingChildren=" + isGettingChildren,
    "isGettingNewestChapter=" + isGettingNewestChapter,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  if (genres && genres.length > 0) throwErrorIfInvalidGenres(genres);

  const params = [deletedStatus];
  let paramIdx = 2;

  const conditions = [`"deleted_status" = $1::"DeletedStatus"`];
  if (isActived !== undefined) {
    conditions.push(`"is_actived" = $${paramIdx}::boolean`);
    params.push(isActived);
    paramIdx++;
  }

  let selectCols = `"Story"."id"`;

  if (keyword) {
    const kwParam = paramIdx++;
    params.push(keyword);
    conditions.push(`(
      similarity("Story"."title", $${kwParam}) > ${STORY_SEARCH_SIMILARITY}
      OR EXISTS (
        SELECT 1 FROM unnest("Story"."other_titles") t
        WHERE similarity(t, $${kwParam}) > ${STORY_SEARCH_SIMILARITY}
      )
    )`);
    selectCols = `
      "Story"."id",
      GREATEST(
        similarity("Story"."title", $${kwParam}),
        COALESCE((
          SELECT MAX(similarity(t, $${kwParam}))
          FROM unnest("Story"."other_titles") AS t
        ), 0)
      ) AS score
    `;
  }

  if (type && type.length > 0) {
    conditions.push(`"Story"."type" = ANY($${paramIdx++}::text[]::"StoryType"[])`);
    params.push(type);
  }

  if (genres && genres.length > 0) {
    conditions.push(`EXISTS (
      SELECT 1 FROM "Story_Genre"
      WHERE "Story_Genre"."story_id" = "Story"."id"
      AND "Story_Genre"."genre" = ANY($${paramIdx++}::text[]::"Genre"[])
    )`);
    params.push(genres);
  }

  if (authorsId && authorsId.length > 0) {
    conditions.push(`EXISTS (
      SELECT 1 FROM "Story_Author"
      WHERE "Story_Author"."story_id" = "Story"."id"
      AND "Story_Author"."author_id" = ANY($${paramIdx++}::uuid[])
    )`);
    params.push(authorsId);
  }

  if (status && status.length > 0) {
    conditions.push(`"Story"."status" = ANY($${paramIdx++}::text[]::"StoryStatus"[])`);
    params.push(status);
  }

  if (nation && nation.length > 0) {
    conditions.push(`EXISTS (
      SELECT 1 FROM "Nation"
      WHERE "Nation"."id" = "Story"."nation_id"
      AND "Nation"."name" = ANY($${paramIdx++}::text[])
    )`);
    params.push(nation);
  }

  if (star && star.length > 0) {
    const starOrs = star
      .map(([min, max]) => {
        const p1 = paramIdx++;
        const p2 = paramIdx++;
        params.push(min, max);
        return `("Story"."star" >= $${p1} AND "Story"."star" <= $${p2})`;
      })
      .join(" OR ");
    conditions.push(`(${starOrs})`);
  }

  if (view && view.length > 0) {
    const viewOrs = view
      .map(([min, max]) => {
        const p1 = paramIdx++;
        const p2 = paramIdx++;
        params.push(min, max);
        return `("Story"."view" >= $${p1} AND "Story"."view" <= $${p2})`;
      })
      .join(" OR ");
    conditions.push(`(${viewOrs})`);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  let orderByClause = "";
  if (sort) {
    const sortKeys = Object.keys(sort);
    if (sortKeys.length > 0) {
      const key = sortKeys[0];
      const dir = sort[key].toString().toLowerCase() === "asc" ? "ASC" : "DESC";
      if (key === "score" && keyword) {
        orderByClause = `ORDER BY score ${dir}`;
      } else {
        const allowedColumns = ["updated_at", "created_at", "view", "star", "id"];
        if (allowedColumns.includes(key)) {
          orderByClause = `ORDER BY "${key}" ${dir}, "id" DESC`;
        } else {
          orderByClause = `ORDER BY "updated_at" DESC, "id" DESC`;
        }
      }
    }
  }

  if (!orderByClause) {
    orderByClause = `ORDER BY "updated_at" DESC, "id" DESC`;
  }

  const limitClause = `LIMIT $${paramIdx++}`;
  params.push(limit);
  const offsetClause = `OFFSET $${paramIdx++}`;
  params.push((page - 1) * limit);

  const queryStr = `
    SELECT ${selectCols}
    FROM "Story"
    ${whereClause}
    ${orderByClause}
    ${limitClause}
    ${offsetClause}
  `;

  const resultIds = await db.$queryRawUnsafe(queryStr, ...params);
  const ids = resultIds.map((row) => row.id);

  const countQueryStr = `
    SELECT COUNT(*)::int AS total
    FROM "Story"
    ${whereClause}
  `;
  const countParams = params.slice(0, params.length - 2);
  const totalItemsResult = await db.$queryRawUnsafe(countQueryStr, ...countParams);
  const totalItems = Number(totalItemsResult[0].total);

  let stories = [];
  if (ids.length > 0) {
    const fetchedStories = await db.story.findMany({
      where: { id: { in: ids } },
      include: {
        authors: { select: { author: { select: { id: true, name: true } } } },
        cover_art: true,
        nation: { select: { name: true, flag_icon: true, flag_image: { select: { url: true, height: true, width: true } } } },
        genres: { select: { genre: true } },
      },
    });

    const idMap = new Map();
    fetchedStories.forEach((s) => idMap.set(s.id, s));

    // Maintain the order returned by the raw query sorting
    stories = ids.map((id) => idMap.get(id)).filter(Boolean);
  }

  // Mapping the result
  for (const story of stories) {
    story.authors = story.authors?.map((author) => author.author);
    story.genres = story.genres?.map((genre) => genre.genre);

    if (story.favourite && story.favourite.length > 0) story.favourite = story.favourite[0];
    if (isGettingChildren) story.children = await BuildStoryTree(story.id, null);
    if (isGettingNewestChapter) {
      story.newest_chapter = await GetNewestChapter(story.id, 5);
    }
  }

  const result = {
    success: true,
    data: stories,
    pagination: {
      page: page,
      pageSize: stories.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindStory({
  id,
  title,
  isGettingChildren = false,
  isGettingContent = false,
  isGettingNewestChapter = false,
  isActived,
  deletedStatus = "not_deleted",
}) {
  const storiesVer = await redisUtils.stories(id || title).get();

  const REDIS_KEY = [
    "FindStory",
    "storiesVer=" + storiesVer,
    "id=" + id,
    "title=" + title,
    "isGettingChildren=" + isGettingChildren,
    "isGettingNewestChapter=" + isGettingNewestChapter,
    "isGettingContent=" + isGettingContent,
    "isActived=" + isActived,
    "deletedStatus=" + deletedStatus,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);

  if (cached) return JSON.parse(cached);

  const story = await db.story.findFirst({
    where: { ...(id && { id: id }), ...(title && { title: title }), deleted_status: deletedStatus, is_actived: isActived, deleted_status: deletedStatus },
    include: {
      authors: { select: { author: { select: { id: true, name: true } } } },
      genres: { select: { genre: true } },
      cover_art: { select: { url: true, height: true, width: true } },
      nation: { select: { name: true, flag_icon: true, flag_image: { select: { url: true, height: true, width: true } } } },
    },
  });

  if (!story) {
    return { success: false, data: null };
  }

  story.authors = story.authors.map((author) => author.author);
  story.genres = story.genres.map((genre) => genre.genre);

  if (isGettingChildren) {
    story.children = await BuildStoryTree(story.id, null, isGettingContent);
  }

  if (isGettingNewestChapter) {
    story.newest_chapter = await GetNewestChapter(story.id, 5);
  }

  const result = { success: true, data: story };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindRandomStory() {
  const stories = await db.story.findMany({
    where: { deleted_status: "not_deleted", is_actived: true },
    select: { id: true, title: true, type: true },
  });

  const random = randomInt(0, stories.length);

  return { success: true, data: stories[random] };
}

export async function AddStory({ title, otherTitles, type, nation, genres, authorIds, status, posterId, summary, coverArt }) {
  if (!title || !type) throw CreateError(400, "'title' and 'type' are required");

  if (otherTitles && otherTitles.length > 0) {
    otherTitles = [...new Set(otherTitles.map((title) => title.trim()))];
  }

  console.log(otherTitles);

  return await db.$transaction(async (tx) => {
    if (authorIds) {
      const authors = await tx.author.findMany();
      const authorsSet = new Set(authors.map((author) => author.id));

      const invalidAuthors = [];
      for (const author of authorIds) {
        if (!authorsSet.has(author)) invalidAuthors.push(author);
      }

      if (invalidAuthors.length > 0) throw CreateError(400, `${invalidAuthors.join(",")} ${invalidAuthors.length > 1 ? "are" : "is"} not exist`);
    }

    // If not exist
    const newStory = await tx.story
      .create({
        data: {
          ...(type && { type: type }),
          ...(title && { title: title }),
          ...(otherTitles && otherTitles.length > 0 && { other_titles: otherTitles }),
          ...(status && { status: status }),
          ...(summary && { summary: summary }),
          ...(posterId && { poster: { connect: { id: posterId } } }),
          ...(nation && { nation: { connect: { name: nation.name } } }),
          ...(genres && genres.length > 0 && { genres: { create: genres.map((genre) => ({ genre: genre })) } }),
          ...(authorIds && authorIds.length > 0 && { authors: { connectOrCreate: authorIds.map((authorId) => ({ author_id: authorId })) } }),
          ...(coverArt && { cover_art: { connectOrCreate: { where: { url: coverArt.url }, create: { url: coverArt.url, public_id: coverArt.publicId } } } }),
        },
      })
      .catch(async (error) => {
        const uniqueTitle = title ? await db.story.findUnique({ where: { title: title } }) : undefined;
        if (uniqueTitle) throw CreateError(400, `'${title}' đã có nguời đăng ký`);

        throw new Error(error);
      });

    redisUtils.stories().incr();

    return { success: true, data: newStory };
  });
}

export async function ToggleSoftDeleteStory(id, deletedStatus = "not_deleted") {
  if (!id) throw CreateError(400, "Require at least id or title");

  if (!isUUID(id)) throw CreateError(400, "'id' must be uuid");

  const softDelete = await db.story
    .update({
      where: { id: id },
      data: { deleted_status: deletedStatus },
    })
    .catch(async (error) => {
      const story = await db.story.findUnique({ where: { id: id, deleted_status: "not_deleted" } });
      if (!story) throw CreateError(400, "Story not found");

      throw new Error(error);
    });

  redisUtils.stories().incr();
  redisUtils.stories(softDelete.id).incr();

  return { success: true, data: softDelete };
}

export async function ToggleSoftDeleteManyStories(ids = [], deletedStatus = "not_deleted") {
  if (ids.length <= 0) throw CreateError(400, "Require ids");

  const toggle = await db.story
    .updateManyAndReturn({
      where: { id: { in: ids } },
      data: { deleted_status: deletedStatus },
    })
    .catch(async (error) => {
      const stories = await db.story.findMany({ where: { id: { in: ids } } });
      const storyIdsSet = new Set(stories.map((story) => story.id));

      const missing = [];
      ids.forEach((id) => {
        if (!storyIdsSet.has(id)) missing.push(id);
      });

      if (missing.length > 0) throw CreateError(400, `${missing.join(", ")} not found`);

      throw new Error(error);
    });

  redisUtils.stories().incr();
  Promise.all(ids.map((id) => redisUtils.stories(id).incr()));

  return { success: true, data: toggle };
}

export async function HardDeleteStory(id) {
  if (!id) throw CreateError(400, "Require at least id or title");

  await db.story
    .update({
      where: { id: id },
      data: { deleted_status: "pending_permanent_deletion" },
    })
    .catch(async (error) => {
      const story = await db.story.findUnique({ where: { id: id } });
      if (!story) throw CreateError(404, "Story not found");

      throw new Error(error);
    });

  storyQueue.addJob_HardDeleteStory(id);

  redisUtils.stories().incr();
  redisUtils.stories(id).incr();

  return { success: true, message: "Story is being permanently deleted" };
}

export async function HardDeleteManyStories(ids = []) {
  if (ids.length <= 0) CreateError(400, "Require ids");

  await db.story.updateMany({ where: { id: { in: ids } }, data: { deleted_status: "pending_permanent_deletion" } });

  storyQueue.addJob_HardDeleteManyStories(ids);

  await redisUtils.stories().incr();
  await Promise.all(ids.map((id) => redisUtils.stories(id).incr()));

  return { success: true, data: "Stories is being permanently deleted" };
}

export async function ActiveStory(id, isActived = true) {
  if (typeof isActived !== "boolean") throw CreateError(400, "'isActived' must be boolean");

  const active = await db.story
    .update({
      where: { id: id, deleted_status: "not_deleted" },
      data: { is_actived: isActived },
      include: { cover_art: { select: { url: true, height: true, width: true } } },
    })
    .catch(async (error) => {
      const story = await db.story.findUnique({ where: { ...(id && { id: id }), ...(title && { title: title }) }, deleted_status: "not_deleted" });
      if (!story) throw CreateError(404, "Story not found");

      throw new Error(error);
    });

  redisUtils.stories().incr();
  redisUtils.stories(active.id).incr();
  redisUtils.stories(active.title).incr();

  return { success: true, data: active };
}

export async function EmbeddingStory(id) {
  const story = await db.story.findUnique({ where: { id: id } });
  if (!story) throw CreateError(404, "Story not found");

  storyQueue.addJob_EmbeddingStory(id);

  return { success: true, message: "Story is being embedded" };
}

export async function UpdateStory(
  id,
  {
    title,
    otherTitles,
    type,
    view,
    summary,
    posterId,
    nation,
    status,
    genres,
    coverArt,
    nextChapterIn,
    authorIds,

    children,
    // children = {
    //   delete: { story_node: [{ id }], content: [{ id }] },
    //   add: {
    //     story_node: [{ id, story_id, parent_id, order_index, type }],
    //     content: [{ id, type, story_node_id, order_index, image: { id, url, public_id, key } }],
    //   },
    //   edit: {
    //     story_node: [{ id, order_index, story_id, title, type, content: [{ id, order_index, type }] }],
    //     content: [{ id, order_index, type, image: { id, url, key, public_id } }],
    //   },
    // },
  },
  editorEmail,
) {
  if (authorIds && authorIds.length > 0) {
    for (const authorId of authorIds) {
      if (!isUUID(authorId)) throw CreateError(400, "authorIds must be uuid[]");
    }
  }

  if (genres && genres.length > 0) {
    genres = ValidateGenre(genres);
  }

  if (otherTitles && otherTitles.length > 0) {
    otherTitles = [...new Set(otherTitles.map((title) => title.trim()))];
  }

  const story = await db.story.findUnique({ where: { id: id } });
  if (!story) throw CreateError(400, "Story not found");

  storyQueue.addJob_UpdateStory(
    story.id,
    { title, otherTitles, type, view, summary, posterId, nation, status, genres, coverArt, nextChapterIn, authorIds, children },
    editorEmail,
  );

  return { success: true, message: "Story is being updated" };
}

export async function UpdateStoryCoverArt(storyId, coverArt) {
  const updateStory = await db.story
    .update({
      where: { id: storyId },
      data: {
        ...(coverArt && {
          cover_art: {
            connectOrCreate: {
              where: { key: coverArt?.key },
              create: { url: coverArt?.url, key: coverArt?.key, width: coverArt?.width, height: coverArt?.height },
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

  return { success: true, data: updateStory };
}

export async function AddOneViewForStory(id) {
  if (!id) throw new Error("Require id");

  const story = await db.story.update({
    where: { id: id },
    data: { view: { increment: 1 } },
  });

  return { success: true, data: story };
}

export async function GetRecommendStories({ storyId, userId, page = 1, limit = 10 }) {
  if (!storyId) throw CreateError(400, "Require at least 'storyId'");

  let ids = [];

  const storiesVer = redisUtils.stories().get();

  const REDIS_KEY = ["GetRecommendStories", "storiesVer=" + storiesVer, "storyId=" + storyId, "userId=" + userId, "page=" + page, "limit=" + limit].join(":");

  const cached = await redis.get(REDIS_KEY);

  if (cached) {
    ids = JSON.parse(cached);
  } else {
    const story = (
      await db.$queryRaw`
    SELECT id, embedding::text
    FROM "Story"
    WHERE id::uuid = ${storyId}::uuid
    LIMIT 1
  `
    )[0];

    ids = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL ivfflat.probes = 100`;

      const recommendStory = await tx.$queryRaw`
        SELECT id,
              1 - (embedding <=> ${story.embedding}::vector) AS similarity
        FROM "Story"
        WHERE id::uuid != ${story.id}::uuid
        ORDER BY embedding <=> ${story.embedding}::vector
        LIMIT ${limit}
      `;

      return recommendStory.map((item) => item.id);
    });
  }

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(ids));

  const stories = await db.story.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      type: true,
      view: true,
      star: true,
      cover_art: { select: { key: true, url: true, width: true, height: true } },
    },
  });

  return { success: true, data: stories };
}
