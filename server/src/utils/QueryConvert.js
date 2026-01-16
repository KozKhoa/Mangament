import dayjs from "dayjs";

export function ConvertQuery(query) {
  const isGettingChildren = query.isGettingChildren == "true" ? true : false;
  const isGettingContent = query.isGettingContent == "true" ? true : false;
  const isGettingNewestChapter = query.isGettingNewestChapter == "true" ? true : false;
  const isGettingSummary = query.isGettingSummary == "true" ? true : false;

  const limit = query.limit ? Number(query.limit) : 100;

  const page = query.page ? Number(query.page) : 1;

  const type = query.type ? query.type.split(",") : null;

  const genres = query.genre ? query.genre.split(",") : null;

  const authors = query.author ? query.author.split(",") : null;

  const nations = query.nation ? query.nation.split(",") : null;

  const status = query.status ? query.status.split(",") : null;

  // rating = [[1,2], [4,5]]
  const star = query.star ? query.star.split(",").map((range) => range.split("-").map((number) => parseFloat(number))) : [[0, 6]];
  // view = [[0, 100], [1000, 100000]]
  const view = query.view ? query.view.split(",").map((range) => range.split("-").map((number) => Number(number))) : [[0, 2147483647]];

  const sort = {};
  if (query?.sort) {
    const [field, direction] = query.sort.split(":");
    sort[field.toLowerCase()] = direction.toLowerCase();
  } else {
    sort["updated_at"] = "desc";
  }

  const keyword = query.keyword ? query.keyword : null;

  let fromDate = query.fromDate ? dayjs(query.fromDate).startOf("day").toDate() : null;
  if (fromDate == "Invalid Date") fromDate = null;
  let toDate = query.toDate ? dayjs(query.toDate).endOf("day").toDate() : null;
  if (toDate == "Invalid Date") toDate = null;

  return {
    isGettingChildren,
    isGettingContent,
    isGettingNewestChapter,
    isGettingSummary,
    limit,
    page,
    type,
    genres,
    star,
    status,
    view,
    authors,
    nations,
    sort,
    fromDate,
    toDate,
    keyword,
  };
}
