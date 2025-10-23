import path from "path";
import { mkdir, rename, copyFile, unlink } from "fs/promises";

import DIRECTORY from "../constants/Directory.js";
import { error } from "console";

export async function CreateNewFolder(path) {
  await mkdir(path, { recursive: true }, (err) => {
    if (err) {
      console.log("❌ Fail to create new folder " + path);
      return false;
    } else
      return {
        success: true,
        message: "Creat new folder success fully",
        path: path,
      };
  });
}

export async function MoveFile(oldPath, newPath) {
  try {
    await copyFile(oldPath, newPath);
    await unlink(oldPath);
    return true;
  } catch (error) {
    console.log(
      "❌ Fail to move file from " + oldPath + " to " + newPath,
      error
    );
    return false;
  }
}

export async function SoftDeleteFile(filePath) {
  try {
    const deletePath =
      DIRECTORY.TRASH + "/" + Date.now() + path.extname(filePath);
    await copyFile(filePath, deletePath);
    return deletePath;
  } catch (error) {
    console.log("❌ Fail to soft delete file " + filePath, error);
    return false;
  }
}
