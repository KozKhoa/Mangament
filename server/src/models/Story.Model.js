import db from "../configs/db.js";
import { redis } from "../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { randomInt } from "../utils/Number.js";
import { ValidateStoryType } from "./Enum.Model.js";
import { ValidateGenre } from "./Genre.Model.js";

import { validate as isUUID } from "uuid";
import { incrRedisStoryNodesVersion } from "./StoryNode.Model.js";

const REDIS_TTL = 60 * 60; // 60 minutes

// Đây là hàm lấy version redis. Khi adim thêm mới story thì sẽ update version lên
async function getRedisStoriesVersion() {
  const versionKey = `version:stories`;
  let version = await redis.get(versionKey);

  if (!version) {
    version = 1;
    await redis.set(versionKey, version);
  }

  return version;
}

// Đây là hàm dùng để tăng version cho việc lấy và build story
async function incrRedisStoriesVersion() {
  await redis.incr(`version:stories`);
}

export async function BuildStoryTree(storyId, storyNodeId, isGettingContent = false) {
  const version = await getRedisStoriesVersion();

  const REDIS_KEY = ["BuildStoryTree", "v=" + version, storyId, storyNodeId, isGettingContent].join(":");

  const cached = await redis.get(REDIS_KEY);

  if (cached) return JSON.parse(cached);

  const storyNodes = await db.storyNode.findMany({
    where: {
      is_deleted: false,
      story: {
        is: { id: storyId, is_deleted: false },
      },
      ...(storyNodeId && { parent_id: storyNodeId }),
    },
    include: {
      ...(isGettingContent && {
        content: {
          where: { is_deleted: false },
          include: { image: { where: { is_deleted: false } } },
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
  const version = await getRedisStoriesVersion();

  const REDIS_KEY = ["GetNewestChapter", "v=" + version, "storyId=" + storyId, "number=" + number].join(":");

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
  const version = await getRedisStoriesVersion();

  const REDIS_KEY = ["GetReview:", "v=" + version, storyId, number].join(";");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const imageUrl = [];

  const dfs = async (parentId) => {
    const nodes = await db.storyNode.findMany({
      where: {
        parent_id: parentId,
        story_id: storyId,
      },
      orderBy: {
        order_index: "asc",
      },
      select: {
        id: true,
        type: true,
        story_id: true,
        parent_id: true,
        content: true,
      },
    });

    for (const node of nodes) {
      if (node.type === "chapter") {
        const contents = node.content;
        if (!contents || contents.length <= 0) return;

        for (const content of contents) {
          imageUrl.push(content.image_url);
          if (imageUrl.length >= number) return;
        }
      } else {
        await dfs(node.id);
      }
    }
  };

  await dfs(null);

  const result = imageUrl.slice(0, 4);

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
  isGettingChildren = false,
  isGettingNewestChapter = false,
}) {
  const version = await getRedisStoriesVersion();

  const REDIS_KEY = [
    "FindAllStories",
    "v=" + version,
    "page=" + page,
    "limit=" + limit,
    "sort=" + JSON.stringify(sort),
    "isActived=" + isActived,
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

  const where = {
    is_deleted: false,
    is_actived: isActived,
    ...(keyword && { title: { contains: keyword, mode: "insensitive" } }),
    ...(type && type.length > 0 && { type: { in: type } }),
    ...(genres && genres.length > 0 && { genres: { some: { genre: { in: genres } } } }),
    ...(authorsId && authorsId.length > 0 && { authors: { some: { author_id: { in: authorsId } } } }),
    ...(status && status.length > 0 && { status: { in: status } }),
    ...(nation && nation.length > 0 && { nation: { name: { in: nation } } }),
    AND: [
      {
        OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
      },
      {
        OR: [...view.map(([min, max]) => ({ view: { gte: min, lte: max } }))],
      },
    ],
  };

  const stories = await db.story.findMany({
    where: where,

    include: {
      authors: { select: { author: { select: { id: true, name: true } } } },
      cover_art: { select: { url: true, height: true, width: true } },
      nation: { select: { name: true, flag_icon: true, flag_image: { select: { url: true, height: true, width: true } } } },
      genres: { select: { genre: true } },
    },
    orderBy: [sort, { updated_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalItems = await db.story.count({ where: where });

  for (const story of stories) {
    story.authors = story.authors.map((author) => author.author);
    story.genres = story.genres.map((genre) => genre.genre);

    if (story.favourite && story.favourite.length > 0) story.favourite = story.favourite[0];
    if (isGettingChildren) story.children = await BuildStoryTree(story.id, null);
    if (isGettingNewestChapter) {
      story.newest_chapter = await GetNewestChapter(story.id, 5);
    }

    delete story.cover_art_id;
    delete story.poster_id;
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

export async function FindStory({ id, title, isGettingChildren = false, isGettingContent = false, isGettingNewestChapter = false, isActived }) {
  const version = await getRedisStoriesVersion();

  const REDIS_KEY = [
    "FindStory",
    "v=" + version,
    "id=" + id,
    "title=" + title,
    "isGettingChildren=" + isGettingChildren,
    "isGettingNewestChapter=" + isGettingNewestChapter,
    "isGettingContent=" + isGettingContent,
    "isActived=" + isActived,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);

  if (cached) return JSON.parse(cached);

  const story = await db.story.findFirst({
    where: { ...(id && { id: id }), ...(title && { title: title }), is_deleted: false, is_actived: isActived },
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

export async function AddStory({ title, type, nation, genres = [], authorIds, status, posterId, summary, coverArt }) {
  if (!title || !type) throw CreateError(400, "'title' and 'type' are required");

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
          ...(status && { status: status }),
          ...(summary && { summary: summary }),
          ...(posterId && { poster: { connect: { id: posterId } } }),
          ...(nation && { nation: { connect: { name: nation.name } } }),
          ...(genres && { genres: { create: genres.map((genre) => ({ genre: genre })) } }),
          ...(authorIds && { authors: { connectOrCreate: authorIds.map((authorId) => ({ author_id: authorId })) } }),
          ...(coverArt && { cover_art: { connectOrCreate: { where: { url: coverArt.url }, create: { url: coverArt.url, public_id: coverArt.publicId } } } }),
        },
      })
      .catch(async (error) => {
        console.log(error);

        const uniqueTitle = title ? await db.story.findUnique({ where: { title: title } }) : undefined;
        if (uniqueTitle) throw CreateError(400, `'${title}' đã có nguời đăng ký`);
      });

    incrRedisStoriesVersion();

    return { success: true, data: newStory };
  });
}

export async function SoftDeleteStory({ id, title }) {
  if (!(id || title)) throw new Error("Require at least id or title");

  const where = {
    ...(id && { id: id }),
    ...(title && { title: title }),
  };

  return await db.$transaction(async (db) => {
    const story = await db.story.findFirst({ where: where });
    if (!story) throw CreateError(404, "Story not found");

    const softDelete = await db.story.update({ where: where, data: { is_deleted: true } });

    incrRedisStoriesVersion();

    return { success: true, data: softDelete };
  });
}

export async function HardDeleteStory({ id, title }) {
  if (!(id || title)) throw new Error("Require at least id or title");

  const where = {
    ...(id && { id: id }),
    ...(title && { title: title }),
  };

  return await db.$transaction(async (db) => {
    const story = await db.story.findFirst({ where: where });
    if (!story) throw CreateError(404, "Story not found");

    const hardRemove = await db.story.delete({ where: where });

    incrRedisStoriesVersion();

    return { success: true, data: hardRemove };
  });
}

export async function ActiveStory({ storyId, isActived }) {
  if (typeof isActived !== "boolean") throw CreateError(400, "'isActived' must be boolean");

  const story = await db.story.findFirst({ where: { id: storyId, is_deleted: false } });

  if (!story) throw CreateError(400, "Story not found");

  const active = await db.story.update({
    where: { id: storyId, is_deleted: false },
    data: { is_actived: isActived },
    include: { cover_art: { select: { url: true, height: true, width: true } } },
  });

  incrRedisStoriesVersion();

  return { success: true, data: active };
}

export async function UpdateStory(
  id,
  {
    title,
    type,
    view,
    summary,
    posterId,
    nation,
    status,
    genres = [],
    coverArt,
    nextChapterIn,
    authorIds = [],

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
) {
  incrRedisStoriesVersion();

  incrRedisStoryNodesVersion();

  return await db.$transaction(async function (tx) {
    const story = await tx.story.findFirst({ where: { id: id, is_deleted: false } });
    if (!story) {
      throw new Error("Story not found");
    }

    if (authorIds && authorIds.length > 0) {
      for (const authorId of authorIds) {
        if (!isUUID(authorId)) throw new Error("authorIds must be uuid[]");
      }
    }

    if (genres && genres.length > 0) {
      genres = ValidateGenre(genres);
    }

    const result = await tx.story
      .update({
        where: { id: id },
        data: {
          ...(title && { title: title }),
          ...(type && { type: type }),
          ...(view !== undefined && { view: view }),
          ...(summary && { summary: summary }),
          ...(status && { status: status }),
          ...(nextChapterIn && { next_chapter_in: nextChapterIn }),
          ...(nation && { nation: { connect: { name: nation } } }),

          ...(coverArt && {
            cover_art: { connectOrCreate: { where: { url: coverArt?.url }, create: { url: coverArt?.url, key: coverArt?.key } } },
          }),

          ...(posterId && { poster: { connect: { id: posterId } } }),
        },

        include: { cover_art: { select: { url: true, width: true, height: true } } },
      })
      .catch(async (error) => {
        console.log(error);

        const uniqueTitle = title ? await db.story.findUnique({ where: { title: title } }) : undefined;
        if (uniqueTitle) throw CreateError(400, `'${title}' đã có nguời đăng ký`);
      });

    if (genres && genres.length > 0) {
      await tx.story_Genre.deleteMany({ where: { story_id: story.id } });

      await tx.story_Genre.createMany({
        data: genres.map((genre) => ({
          story_id: story.id,
          genre,
        })),
        skipDuplicates: true,
      });
    }

    if (authorIds && authorIds.length > 0) {
      await tx.story_Author.deleteMany({ where: { story_id: story.id } });

      await tx.story_Author.createMany({
        data: authorIds.map((authorId) => ({
          story_id: story.id,
          author_id: authorId,
        })),
        skipDuplicates: true,
      });
    }

    if (children?.delete) {
      // Soft delete story node
      if (children.delete.story_node && children.delete.story_node.length > 0) {
        await tx.storyNode.updateMany({
          where: {
            id: { in: children.delete.story_node.map((node) => node.id) },
          },
          data: { is_deleted: true },
        });
      }

      // Soft delete story node content
      if (children.delete?.content && children.delete.content.length > 0) {
        await tx.storyNodeContent.updateMany({
          where: {
            id: { in: children.delete.content.map((cont) => cont.id) },
          },
          data: { is_deleted: true },
        });
      }
    }

    if (children?.add) {
      // Add story node
      if (children.add.story_node && children.add.story_node.length > 0) {
        await tx.storyNode.createMany({
          data: children.add.story_node.map((node) => ({
            id: node.id,
            story_id: node.story_id,
            parent_id: node.parent_id,
            order_index: node.order_index,
            type: node.type,
          })),
        });
      }

      // Add content
      await tx.storyNodeContent.createMany({
        data: children.add.content.map((cont, i) => ({
          id: cont.id,
          type: cont.type,
          story_node_id: cont.story_node_id,
          order_index: cont.order_index,
          image_id: cont.image.id,
        })),
      });
    }

    if (children?.edit) {
      // Edit story node and update its content index
      await Promise.all(
        children.edit.content.map((content) =>
          tx.storyNodeContent.update({
            where: { id: content.id },
            data: {
              order_index: content.order_index,
              image: {
                connectOrCreate: {
                  where: { url: content?.image?.url, key: content?.image?.key },
                  create: { url: content?.image?.url, key: content?.image?.key },
                },
              },
            },
          }),
        ),
      );

      //  Edit content
      await Promise.all(
        children.edit?.story_node?.map((node) =>
          tx.storyNode.update({
            where: { id: node.id },
            data: {
              order_index: node.order_index,
              title: node.title,
              type: node.type,
              content: { updateMany: node.content.map((cont) => ({ where: { id: cont.id }, data: { order_index: cont.order_index, type: cont.type } })) },
            },
          }),
        ),
      );
    }

    return { success: true, data: result };
  });
}

export async function AddOneViewForStory(storyId) {
  if (!storyId) throw new Error("Require id");

  const story = await db.story.update({
    where: { id: storyId },
    data: { view: { increment: 1 } },
  });

  return { success: true, data: story };
}

export async function CountStory() {
  const count = await db.story.count({ where: { is_deleted: false, is_actived: true } });
  return { success: true, data: count };
}

export async function FindRandomStory() {
  const stories = await db.story.findMany({
    where: { is_deleted: false, is_actived: true },
    select: { id: true, title: true, type: true },
  });

  const random = randomInt(0, stories.length);

  return { success: true, data: stories[random] };
}
