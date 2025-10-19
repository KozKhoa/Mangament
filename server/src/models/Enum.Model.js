import db from "../configs/db.js";
import { Role, Gender, Genre } from "../configs/db.js";

export function GetAllGenre() {
  return Object.values(Genre)
}

export function ValidateGenre( genre) {
  const genreList = GetAllGenre();
  return genreList.includes(genre);
}

export function GetAllGender() {
  return Object.values(Gender);
}

export function ValidateGender(gender) {
  const genderList = GetAllGender();
  return genderList.includes(gender);
}

export function GetAllRole() {
  return Object.values(Role);
}

export function ValidateRole(role) {
  const roleList = GetAllRole();
  return roleList.includes(role);
}
