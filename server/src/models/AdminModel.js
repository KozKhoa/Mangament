import db, { Role, StoryStatus } from "../configs/db.js";
import { redis } from "../configs/redis.js";

import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths, endOfHour, startOfHour, addDays, addHours, addWeeks, addMonths } from "date-fns";
import { setToEndDate, setToStartDate, setToStartHour, setToEndHour } from "../utils/Date.js";
import { Prisma } from "../generated/prisma/index.js";

const REDIS_CACHE_DASHBOARD_OVERVIEW_KEY = "admin:dashboard:overview";

const REDIS_CACHE_DASHBOARD_VIEW_KEY = "admin:dashboard:stats:views";

const REDIS_CACHE_DASHBOARD_NEW_USERS_KEY = "admin:dashboard:stats:new-users";

const TTL = 60 * 60;

const intervalMap = {
  hour: "1 hour",
  day: "1 day",
  week: "1 week",
  month: "1 month",
  year: "1 year",
};

export async function GetDashboardOverview() {
  const cached = await redis.get(REDIS_CACHE_DASHBOARD_OVERVIEW_KEY);

  if (cached) return JSON.parse(cached);

  const dbResponse = await db.$queryRaw`
    SELECT
      (SELECT COUNT(*)::int FROM "User" WHERE is_deleted = false) AS "totalUsers",

      (SELECT COUNT(*)::int 
      FROM "User" 
      WHERE is_deleted = false AND is_banned = true) AS "totalBannedUsers",

      (SELECT COUNT(*)::int 
      FROM "Story" 
      WHERE is_deleted = false) AS "totalStories",

      (SELECT COALESCE(SUM(view), 0)::int
      FROM "Story" 
      WHERE is_deleted = false) AS "totalView",

      (SELECT COUNT(*)::int 
      FROM "Rating" 
      WHERE is_deleted = false) AS "totalRating",

      (
        SELECT COALESCE(json_object_agg(status, total), '{}'::json)
        FROM (
          SELECT status, COUNT(*)::int AS total
          FROM "Story"
          WHERE is_deleted = false
          GROUP BY status
        ) t
      ) AS "totalStoriesBaseOnStatus",

      (
        SELECT COALESCE(json_object_agg(role, total), '{}'::json)
        FROM (
          SELECT role, COUNT(*)::int AS total
          FROM "User"
          WHERE is_deleted = false
          GROUP BY role
        ) t
      ) AS "totalUserBaseOnRole";
  `;

  const { totalUsers, totalBannedUsers, totalStories, totalView, totalRating, totalStoriesBaseOnStatus, totalUserBaseOnRole } = dbResponse[0];

  const data = {
    totalStories,
    totalStoriesBaseOnStatus,
    totalUsers,
    totalUserBaseOnRole,
    totalBannedUsers,
    totalView,
    totalRating,
  };

  const result = { success: true, data: data };

  redis.setex(REDIS_CACHE_DASHBOARD_OVERVIEW_KEY, TTL, JSON.stringify(result));

  return result;
}

export async function GetDashboardViews({ storyId, storyNodeId, fromDate, toDate, groupBy = "day" }) {
  const cached = await redis.get([REDIS_CACHE_DASHBOARD_VIEW_KEY, storyId, storyNodeId, fromDate, toDate, groupBy].join(":"));
  if (cached) {
    return { success: true, data: await JSON.parse(cached) };
  } else {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    setToStartDate(from);
    setToEndDate(to);

    const interval = intervalMap[groupBy] ?? "1 day";

    const views = await db.$queryRaw`
        SELECT
          series.date,
          COALESCE(COUNT(rh.id), 0)::int AS view
        FROM generate_series(
          DATE_TRUNC(${groupBy}, ${from}::timestamptz),
          DATE_TRUNC(${groupBy}, ${to}::timestamptz),
          ${Prisma.raw(`INTERVAL '${interval}'`)}
        ) AS series(date)
        LEFT JOIN "ReadingHistory" rh
          ON DATE_TRUNC(${groupBy}, rh.created_at) = series.date
          AND rh.created_at >= ${from}
          AND rh.created_at <= ${to}
          ${storyId ? Prisma.sql`AND rh.story_id = ${storyId}::uuid` : Prisma.empty}
          ${storyNodeId ? Prisma.sql`AND rh.story_node_id = ${storyNodeId}::uuid` : Prisma.empty}
        GROUP BY series.date
        ORDER BY series.date;
      `;

    await redis.setex([REDIS_CACHE_DASHBOARD_VIEW_KEY, storyId, storyNodeId, fromDate, toDate, groupBy].join(":"), TTL, JSON.stringify(views));

    return { success: true, data: views };
  }
}

export async function GetDashboardNewUsers({ fromDate, toDate, groupBy = "day" }) {
  const cached = await redis.get([REDIS_CACHE_DASHBOARD_NEW_USERS_KEY, fromDate, toDate, groupBy].join(":"));
  if (cached) {
    return { success: true, data: await JSON.parse(cached) };
  } else {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    setToStartDate(from);
    setToEndDate(to);

    const interval = intervalMap[groupBy] ?? "1 day";

    const newUsers = await db.$queryRaw`
        SELECT
          series.date,
          COALESCE(COUNT(u.id), 0)::int AS count
        FROM generate_series(
          DATE_TRUNC(${groupBy}, ${from}::timestamptz),
          DATE_TRUNC(${groupBy}, ${to}::timestamptz),
          ${Prisma.raw(`INTERVAL '${interval}'`)}
        ) AS series(date)
        LEFT JOIN "User" u
          ON DATE_TRUNC(${groupBy}, u.join_date) = series.date
          AND u.join_date >= ${from}
          AND u.join_date <= ${to}
        GROUP BY series.date
        ORDER BY series.date;
      `;

    await redis.setex([REDIS_CACHE_DASHBOARD_NEW_USERS_KEY, fromDate, toDate, groupBy].join(":"), TTL, JSON.stringify(newUsers));

    return { success: true, data: newUsers };
  }
}
