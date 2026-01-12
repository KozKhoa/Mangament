import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: "api-key/google-drive-api-key.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

async function listRoot() {
  const res = await drive.files.list({
    q: "trashed=false",
    fields: "files(id, name, mimeType)",
  });

  return res.data.files;
}

const isFolder = (file) => file.mimeType === "application/vnd.google-apps.folder";

export async function listAllFiles() {
  let files = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: "trashed=false",
      fields: "nextPageToken, files(id, name, mimeType, parents)",
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    files.push(...res.data.files);
    pageToken = res.data.nextPageToken;

    console.log("Getting ", files.length, " files ...");
  } while (pageToken);

  return files;
}

export async function listChildren(parentId) {
  if (!parentId || parentId === "root") {
    return listAllFiles();
  }

  let files = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType, parents)",
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    files.push(...res.data.files);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function walkFolder(folderId = "root", depth = 0, callback = (child) => {}) {
  const children = await listChildren(folderId);

  for (const child of children) {
    console.log(" ".repeat(depth * 2) + "- " + child.name);
    callback(child);

    if (child.mimeType === "application/vnd.google-apps.folder") {
      await walkFolder(child.id, depth + 1, callback);
    }
  }
}
