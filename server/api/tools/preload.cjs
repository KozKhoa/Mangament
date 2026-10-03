const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getDownloadsDir: () => ipcRenderer.invoke("app:get-downloads-dir"),
  openInFolder: (pathStr) => ipcRenderer.invoke("shell:open-item", pathStr),
  selectDirectory: () => ipcRenderer.invoke("dialog:select-directory"),
  selectSavePath: (defaultName) => ipcRenderer.invoke("dialog:select-save-path", defaultName),
  startPack: (options) => ipcRenderer.invoke("pack:start", options),
  startPdfPack: (options) => ipcRenderer.invoke("pack-pdf:start", options),
  onLog: (callback) => {
    const listener = (event, msg) => callback(msg);
    ipcRenderer.on("pack:log", listener);
    return () => ipcRenderer.removeListener("pack:log", listener);
  },
  onProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on("pack:progress", listener);
    return () => ipcRenderer.removeListener("pack:progress", listener);
  },
});
