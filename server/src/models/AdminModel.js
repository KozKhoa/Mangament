import db, { Role, StoryStatus } from "../configs/db.js";
import { redis } from "../configs/redis.js";

import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths, endOfHour, startOfHour, addDays, addHours, addWeeks, addMonths } from "date-fns";
import { setToEndDate, setToStartDate, setToStartHour, setToEndHour } from "../utils/Date.js";

const REDIS_CACHE_DASHBOARD_OVERVIEW_KEY = "admin:dashboard:overview";
const REDIS_CACHE_DASHBOARD_OVERVIEW_TTL = 60;

const REDIS_CACHE_DASHBOARD_VIEW_KEY = "admin:dashboard:stats:views";
const REDIS_CACHE_DASHBOARD_VIEW_TTL = 60;

export async function GetDashboardOverview() {
  const cached = await redis.get(REDIS_CACHE_DASHBOARD_OVERVIEW_KEY);

  if (cached) {
    return { success: true, data: JSON.parse(cached) };
  } else {
    const totalUsers = (await db.user.count({ where: { is_deleted: false } })) ?? 0;
    const totalBannedUsers = (await db.user.count({ where: { is_banned: true, is_deleted: false } })) ?? 0;
    const totalStories = (await db.story.count({ where: { is_deleted: false } })) ?? 0;
    const totalView = (await db.story.aggregate({ _sum: { view: true } }))._sum.view ?? 0;

    const storyStatus = Object.values(StoryStatus);
    const totalStoriesBaseOnStatus = [];
    for (const status of storyStatus) {
      totalStoriesBaseOnStatus.push({ [status]: (await db.story.count({ where: { is_deleted: false, status: status } })) ?? 0 });
    }

    const userRoles = Object.values(Role);
    const totalUserBaseOnRole = [];
    for (const role of userRoles) {
      totalUserBaseOnRole.push({ [role]: (await db.user.count({ where: { is_deleted: false, role: role } })) ?? 0 });
    }

    const data = {
      totalStories,
      totalStoriesBaseOnStatus,
      totalUsers,
      totalUserBaseOnRole,
      totalBannedUsers,
      totalView,
    };

    await redis.setex(REDIS_CACHE_DASHBOARD_OVERVIEW_KEY, REDIS_CACHE_DASHBOARD_OVERVIEW_TTL, JSON.stringify(data));

    return { success: true, data: data };
  }
}

export async function GetDashboardViews({ storyId, storyNodeId, fromDate, toDate, groupBy = "day" }) {
  const cached = await redis.get(REDIS_CACHE_DASHBOARD_VIEW_KEY + fromDate + toDate + groupBy);
  if (cached) {
    return { success: true, data: await JSON.parse(cached) };
  } else {
    let views = [];

    const from = new Date(fromDate);
    const to = new Date(toDate);

    switch (groupBy) {
      case "hour":
        setToStartDate(from);
        setToEndDate(to);

        // for (let hour = new Date(from); hour < to; hour = addHours(hour, 1)) {
        //   const start = new Date(hour);
        //   setToStartHour(start);
        //   let end = new Date(hour);

        //   if (end > to) end = new Date(to);
        //   setToEndHour(end);

        //   const countHour = await db.readingHistory.count({ where: { created_at: { gte: start, lte: end } } });

        //   views.push({ from: start, to: end, view: countHour });
        // }

        const countHour = await db.$queryRaw`
            SELECT
              DATE_TRUNC('hour', created_at) AS date,
              COUNT(*)::int AS view
            FROM "ReadingHistory"
            WHERE created_at >= ${from}
            AND created_at <= ${to}
            GROUP BY date
            ORDER BY date;
          `;

        views = countHour;

        break;
      case "day":
        setToStartDate(from);
        setToEndDate(to);

        for (let date = new Date(from); date < to; date = addDays(date, 1)) {
          const start = new Date(date);
          setToStartDate(start);
          let end = new Date(date);

          if (end > to) end = new Date(to);
          setToEndDate(end);

          const countDate = await db.$queryRaw`
            SELECT
              DATE(created_at) AS date,
              COUNT(*)::int AS view
            FROM "ReadingHistory"
            WHERE created_at >= ${start} 
            AND created_at <= ${end}
            GROUP BY date
            ORDER BY date;
          `;

          views.push({ from: start, to: end, view: countDate?.at(0)?.view ?? 0 });
        }

        break;
      case "week":
        setToStartDate(from);
        setToEndDate(to);

        for (let date = new Date(from); date <= to; date = addWeeks(date, 1)) {
          const start = new Date(date);
          setToStartDate(start);

          let end = addWeeks(start, 1);
          if (end > to) end = new Date(to);
          setToEndDate(end);

          const countDate = await db.$queryRaw`
            SELECT
              DATE_TRUNC('week', created_at) AS week,
              COUNT(*)::int AS view
            FROM "ReadingHistory"
            WHERE created_at >= ${start} 
            AND created_at <= ${end}
            GROUP BY week
            ORDER BY week;
          `;

          views.push({ from: start, to: end, view: countDate?.at(0)?.view ?? 0 });
        }

        break;
      case "month":
        setToStartDate(from);
        setToEndDate(to);

        for (let date = new Date(from); date <= to; date = addMonths(date, 1)) {
          const start = new Date(date);
          setToStartDate(start);

          let end = addMonths(start, 1);
          if (end > to) end = new Date(to);
          setToEndDate(end);

          const countDate = await db.$queryRaw`
            SELECT
              DATE_TRUNC('month', created_at) AS month,
              COUNT(*)::int AS view
            FROM "ReadingHistory"
            WHERE created_at >= ${start} 
            AND created_at <= ${end}
            GROUP BY month
            ORDER BY month;
          `;

          views.push({ from: start, to: end, view: countDate?.at(0)?.view ?? 0 });
        }

        break;
    }

    await redis.setex(REDIS_CACHE_DASHBOARD_VIEW_KEY + fromDate + toDate, REDIS_CACHE_DASHBOARD_VIEW_TTL, JSON.stringify(views));

    return { success: true, data: views };
  }
}

export async function GetDashboardNewUsers({ fromDate, toDate, groupBy = "day" }) {
  const endDate = toDate ? new Date(toDate) : new Date();
  const startDate = fromDate ? new Date(fromDate) : new Date(endDate);

  const newUsersByDate = [];

  for (const date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const prevDate = new Date(date);

    setToStartDate(prevDate);
    setToEndDate(date);

    const count = await db.user.count({
      where: {
        is_deleted: false,
        join_date: {
          gte: prevDate,
          lte: date,
        },
      },
      orderBy: { join_date: "asc" },
    });

    newUsersByDate.push({ date: new Date(date), count: count });
  }

  await redis.setex(REDIS_CACHE_DASHBOARD_VIEW_KEY + fromDate + toDate, REDIS_CACHE_DASHBOARD_VIEW_TTL, JSON.stringify(newUsersByDate));

  return { success: true, data: newUsersByDate };
}
