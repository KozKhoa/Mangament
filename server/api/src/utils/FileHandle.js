import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

import DIRECTORY from "../constants/Directory.js";

export async function CreateNewFolder(path) {
  await fs.mkdir(path, { recursive: true }, (err) => {
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
    await fs.copyFile(oldPath, newPath);
    await fs.unlink(oldPath);
    return true;
  } catch (error) {
    console.log("❌ Fail to move file from " + oldPath + " to " + newPath, error);
    return false;
  }
}

export async function SoftRemoveFile(filePath) {
  try {
    const deletePath = path.join(DIRECTORY.TRASH, Date.now() + path.extname(filePath));

    await fs.copyFile(filePath, deletePath);
    return deletePath;
  } catch (error) {
    console.log("❌ Fail to soft delete file " + filePath, error);
    return false;
  }
}

export async function SoftRemoveThingsInFolder(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    for (const file of files) {
      await SoftRemoveFile(path.join(folderPath, file));
    }
    return true;
  } catch (error) {
    console.log("❌ Fail to soft remove thing on folder file " + folderPath, error);
    return false;
  }
}

export async function IsFileExist(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function getAllFiles(folderPath) {
  const files = await fs.readdir(folderPath, {
    recursive: false,
  });

  const fullPaths = files.map((file) => path.resolve(folderPath, file));

  return fullPaths;
}

export async function getMetaData(filePath) {
  const metadata = await sharp(filePath).metadata();
  return metadata;
}
