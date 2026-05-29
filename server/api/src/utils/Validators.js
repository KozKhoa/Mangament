import { CreateError } from "./ErrorHandle.js";

import db, { Gender, Role, StoryStatus, StoryType } from "../../configs/db.js";

export const IsValidEmail = (email) => {
  const regex = new RegExp("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  return regex.test(email);
};

export function throwErrorIfInvalidEmailAndPassword(email, password) {
  // Nếu email và passworđ sai format thì throw lỗi ra luôn
  // Kiểm tra có nhập đầy đủ email hay không
  if (!email) {
    throw CreateError(400, "'email' is required");
  }
  if (!password) {
    throw CreateError(400, "'password' is required");
  }
  if (!IsValidEmail(email)) {
    throw CreateError(400, "'email' is not valid");
  }
  if (password.length < 6) {
    throw CreateError(400, "Password must be at least 6 characters");
  }
}

export function IsJsonString(string) {
  try {
    JSON.parse(string);
    return true;
  } catch {
    return false;
  }
}

export function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function isPrismaError(error) {
  return error?.code !== undefined && typeof error.code === "string" && error?.clientVersion !== undefined;
}

export async function throwErrorIfInvalidGenres(genres = []) {
  if (!genres) return true;

  let inputGenres;
  if (Array.isArray(genres)) {
    inputGenres = genres;
  } else {
    inputGenres = [genres];
  }

  const allGenres = (await db.genre.findMany({ where: { deleted_status: "not_deleted" } })).map((genre) => genre.name);

  const genresSet = new Set(allGenres);

  const invalidGenres = [];
  for (const genre of inputGenres) {
    if (!genresSet.has(genre)) {
      invalidGenres.push(genre);
    }
  }

  if (invalidGenres && invalidGenres.length > 0) {
    throw CreateError(400, invalidGenres.join(", ") + ` ${invalidGenres.length > 1 ? "are" : "is"} not valid genre`);
  }

  return true;
}

export function throwErrorIfInvalidGenders(genders = []) {
  if (!genders) return true;

  let inputGenders;
  if (Array.isArray(genders)) {
    inputGenders = genders;
  } else {
    inputGenders = [genders];
  }

  const allGenders = Object.values(Gender);
  const gendersSet = new Set(allGenders);

  const invalidGenders = [];
  for (const gender of inputGenders) {
    if (!gendersSet.has(gender)) {
      invalidGenders.push(gender);
    }
  }

  if (invalidGenders && invalidGenders.length > 0) {
    throw CreateError(400, invalidGenders.join(", ") + ` ${invalidGenders.length > 1 ? "are" : "is"} not valid gender`);
  }

  return true;
}

export function throwErrorIfInvalidRoles(roles = []) {
  if (!roles) return true;

  let inputRoles;
  if (Array.isArray(roles)) {
    inputRoles = roles;
  } else {
    inputRoles = [roles];
  }

  const allRoles = Object.values(Role);
  const rolesSet = new Set(allRoles);

  const invalidRoles = [];
  for (const role of inputRoles) {
    if (!rolesSet.has(role)) {
      invalidRoles.push(role);
    }
  }

  if (invalidRoles && invalidRoles.length > 0) {
    throw CreateError(400, invalidRoles.join(", ") + ` ${invalidRoles.length > 1 ? "are" : "is"} not valid role`);
  }

  return true;
}

export function throwErrorIfInvalidStoryStatus(storyStatus = []) {
  if (!storyStatus) return true;

  let inputStoryStatus;
  if (Array.isArray(storyStatus)) {
    inputStoryStatus = storyStatus;
  } else {
    inputStoryStatus = [storyStatus];
  }

  const allStoryStatus = Object.values(StoryStatus);
  const storyStatusSet = new Set(allStoryStatus);

  const invalidStoryStatus = [];
  for (const status of inputStoryStatus) {
    if (!storyStatusSet.has(status)) {
      invalidStoryStatus.push(status);
    }
  }

  if (invalidStoryStatus && invalidStoryStatus.length > 0) {
    throw CreateError(400, invalidStoryStatus.join(", ") + ` ${invalidStoryStatus.length > 1 ? "are" : "is"} not valid story status`);
  }

  return true;
}

export function throwErrorIfInvalidStoryType(storyType = []) {
  if (!storyType) return true;

  let inputStoryType;
  if (Array.isArray(storyType)) {
    inputStoryType = storyType;
  } else {
    inputStoryType = [storyType];
  }

  const allStoryType = Object.values(StoryType);
  const storyTypeSet = new Set(allStoryType);

  const invalidStoryType = [];
  for (const type of inputStoryType) {
    if (!storyTypeSet.has(type)) {
      invalidStoryType.push(type);
    }
  }

  if (invalidStoryType && invalidStoryType.length > 0) {
    throw CreateError(400, invalidStoryType.join(", ") + ` ${invalidStoryType.length > 1 ? "are" : "is"} not valid story type`);
  }

  return true;
}
