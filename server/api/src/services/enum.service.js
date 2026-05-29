import { Role, Gender, StoryType, StoryStatus } from "../configs/db.js";

export function GetAllGender() {
  return Object.values(Gender);
}

export function ValidateGender(gender) {
  if (!gender) return false;
  const genderList = GetAllGender();
  return genderList.includes(gender);
}

export function GetAllRole() {
  return Object.values(Role);
}

export function ValidateRole(role) {
  if (!role) return false;
  const roleList = GetAllRole();
  return roleList.includes(role);
}

export function GetAllStoryType() {
  return Object.values(StoryType);
}

export function ValidateStoryType(storyType) {
  if (!storyType) return true;
  const list = GetAllStoryType();
  return list.includes(storyType);
}

export function GetAllStoryStatus() {
  return Object.values(StoryStatus);
}

export function ValidateStoryStatus(status) {
  if (!status) return true;
  return GetAllStoryStatus().includes(status);
}
