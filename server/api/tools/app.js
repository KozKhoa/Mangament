import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { main as runPackerMain } from "./pack-stories-zip/index.js";
import { main as runPdfPackerMain } from "./pack-stories-pdf/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    title: "Mangament Story Packer",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC Handler: Lấy đường dẫn thư mục Downloads mặc định
ipcMain.handle("app:get-downloads-dir", () => {
  return app.getPath("downloads");
});

// IPC Handler: Mở vị trí chứa file trong File Explorer
ipcMain.handle("shell:open-item", (event, pathStr) => {
  if (pathStr) {
    shell.showItemInFolder(pathStr);
  }
});

// IPC Handler: Chọn thư mục nguồn
ipcMain.handle("dialog:select-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Chọn thư mục chứa truyện tranh",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// IPC Handler: Chọn file lưu ZIP
ipcMain.handle("dialog:select-save-path", async (event, defaultName = "manga_batch.zip") => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Chọn nơi lưu file ZIP xuất ra",
    defaultPath: defaultName,
    filters: [
      { name: "ZIP Archives", extensions: ["zip"] },
      { name: "CSV Files", extensions: ["csv"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
});

// IPC Handler: Bắt đầu đóng gói ZIP
ipcMain.handle("pack:start", async (event, options) => {
  const logger = (msg) => {
    event.sender.send("pack:log", msg);
  };
  const onProgress = (data) => {
    event.sender.send("pack:progress", data);
  };

  try {
    const result = await runPackerMain(options, logger, onProgress);
    return { success: true, ...result };
  } catch (err) {
    logger(`❌ [LỖI]: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// IPC Handler: Bắt đầu đóng gói PDF
ipcMain.handle("pack-pdf:start", async (event, options) => {
  const logger = (msg) => {
    event.sender.send("pack:log", msg);
  };
  const onProgress = (data) => {
    event.sender.send("pack:progress", data);
  };

  try {
    const result = await runPdfPackerMain(options, logger, onProgress);
    return { success: true, ...result };
  } catch (err) {
    logger(`❌ [LỖI TẠO PDF]: ${err.message}`);
    return { success: false, error: err.message };
  }
});
