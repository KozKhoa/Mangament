import React, { useState, useEffect, useRef } from "react";
import {
  FolderOpen,
  FileArchive,
  Play,
  Trash2,
  Terminal,
  Filter,
  Layers,
  Zap,
  Package,
  HardDrive,
  FolderCheck,
  Wrench,
  RefreshCw,
  Download,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Sparkles,
} from "lucide-react";

export default function App() {
  const [activeTool, setActiveTool] = useState("pack-stories-zip");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [sourceDir, setSourceDir] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [pdfOutputDir, setPdfOutputDir] = useState("");
  const [defaultDownloadsDir, setDefaultDownloadsDir] = useState("");
  const [packMode, setPackMode] = useState("auto"); // 'auto' | 'single' | 'batch'
  const [storyFilter, setStoryFilter] = useState("");
  const [compressionLevel, setCompressionLevel] = useState("1");
  const [limit, setLimit] = useState("0");
  const [chapterLimit, setChapterLimit] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [csvOnly, setCsvOnly] = useState(false);

  // Packing State
  const [isPacking, setIsPacking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [lastPackedFile, setLastPackedFile] = useState("");
  const [progress, setProgress] = useState({ task: "", percent: 0 });
  const [logs, setLogs] = useState(["Sẵn sàng. Hãy chọn thư mục nguồn và bấm Bắt đầu đóng gói."]);

  const terminalEndRef = useRef(null);

  // Get Default Downloads Directory on load
  useEffect(() => {
    if (window.api?.getDownloadsDir) {
      window.api.getDownloadsDir().then((dir) => {
        if (dir) {
          setDefaultDownloadsDir(dir);
          setOutputPath(`${dir}/manga_batch.zip`);
          setPdfOutputDir(`${dir}/pdf_exports`);
        }
      });
    }
  }, []);

  // Auto scroll log terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // IPC Event Listeners
  useEffect(() => {
    if (window.api) {
      const unbindLog = window.api.onLog((msg) => {
        setLogs((prev) => [...prev, msg]);
      });

      const unbindProgress = window.api.onProgress?.((data) => {
        setProgress({
          task: data.task || "",
          percent: typeof data.percent === "number" ? Math.max(0, Math.min(100, data.percent)) : 0,
        });
      });

      return () => {
        unbindLog?.();
        unbindProgress?.();
      };
    }
  }, []);

  const handleSelectSource = async () => {
    if (window.api?.selectDirectory) {
      const path = await window.api.selectDirectory();
      if (path) setSourceDir(path);
    }
  };

  const handleSelectSave = async () => {
    if (activeTool === "pack-stories-pdf") {
      if (window.api?.selectDirectory) {
        const dir = await window.api.selectDirectory();
        if (dir) setPdfOutputDir(dir);
      }
    } else {
      const defaultName = outputPath ? outputPath.split("/").pop() : "manga_batch.zip";
      if (window.api?.selectSavePath) {
        const path = await window.api.selectSavePath(defaultName);
        if (path) setOutputPath(path);
      }
    }
  };

  const handleOpenFolder = () => {
    const target = lastPackedFile || (activeTool === "pack-stories-pdf" ? pdfOutputDir : outputPath);
    if (target && window.api?.openInFolder) {
      window.api.openInFolder(target);
    }
  };

  const handleStartPack = async () => {
    if (!sourceDir) {
      alert("Vui lòng chọn thư mục nguồn chứa truyện!");
      return;
    }

    setIsPacking(true);
    setIsFinished(false);
    setLastPackedFile("");
    setLogs([]);
    setProgress({ task: "Đang khởi động...", percent: 0 });

    try {
      if (activeTool === "pack-stories-pdf") {
        const finalPdfOutDir = pdfOutputDir || `${defaultDownloadsDir}/pdf_exports`;
        const options = {
          sourceDir,
          outputDir: finalPdfOutDir,
          packMode,
          storyFilter: storyFilter.trim() || null,
          limit: parseInt(limit, 10) || 0,
          chapterLimit: chapterLimit ? parseInt(chapterLimit, 10) : null,
          dryRun,
        };

        const res = await window.api.startPdfPack(options);
        if (res.success) {
          setLogs((prev) => [...prev, "\n✅ HOÀN THÀNH TẠO TẤT CẢ FILE PDF!"]);
          setProgress({ task: "Hoàn tất xuất PDF!", percent: 100 });
          setIsFinished(true);
          setLastPackedFile(res.outputDir || finalPdfOutDir);
        } else {
          setLogs((prev) => [...prev, `\n❌ THẤT BẠI: ${res.error}`]);
          setProgress({ task: "Gặp lỗi trong quá trình tạo PDF!", percent: 0 });
        }
      } else {
        const finalOutput = outputPath || `${defaultDownloadsDir}/manga_batch.zip`;
        const options = {
          sourceDir,
          outputPath: finalOutput,
          packMode,
          storyFilter: storyFilter.trim() || null,
          compressionLevel: parseInt(compressionLevel, 10),
          limit: parseInt(limit, 10) || 0,
          chapterLimit: chapterLimit ? parseInt(chapterLimit, 10) : null,
          dryRun,
          csvOnly,
        };

        const res = await window.api.startPack(options);
        if (res.success) {
          setLogs((prev) => [...prev, "\n✅ HOÀN THÀNH THÀNH CÔNG!"]);
          setProgress({ task: "Hoàn tất đóng gói!", percent: 100 });
          setIsFinished(true);
          setLastPackedFile(res.outputPath || finalOutput);
        } else {
          setLogs((prev) => [...prev, `\n❌ THẤT BẠI: ${res.error}`]);
          setProgress({ task: "Gặp lỗi trong quá trình đóng gói!", percent: 0 });
        }
      }
    } catch (err) {
      setLogs((prev) => [...prev, `\n❌ NGOẠI LỆ: ${err.message}`]);
      setProgress({ task: "Đã xảy ra lỗi ngoại lệ!", percent: 0 });
    } finally {
      setIsPacking(false);
    }
  };

  const toolsList = [
    {
      id: "pack-stories-zip",
      name: "Story Packer (ZIP)",
      desc: "Đóng gói Batch Import ZIP",
      icon: Package,
      active: true,
      badge: "ZIP",
    },
    {
      id: "pack-stories-pdf",
      name: "Story Packer (PDF)",
      desc: "Nén 1 PDF cho mỗi truyện",
      icon: FileText,
      active: true,
      badge: "PDF",
    },
    {
      id: "metadata-sync",
      name: "Metadata Sync",
      desc: "Đồng bộ dữ liệu manga",
      icon: RefreshCw,
      active: false,
      badge: "Sắp tới",
    },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans border-t border-sky-500/20 overflow-hidden selection:bg-sky-500/30 selection:text-sky-200">
      {/* Sidebar Navigation - Collapsible */}
      <aside
        className={`bg-zinc-900/70 border-r border-zinc-800/80 flex flex-col justify-between p-3.5 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 relative z-20 ${
          isSidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Toggle Header */}
          <div className="flex items-center justify-between px-1">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-md shadow-sky-500/20 text-white shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h1 className="text-xs font-bold text-zinc-100 tracking-tight flex items-center gap-1.5 truncate">Mangament Tools</h1>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">server/api/tools</p>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-md shadow-sky-500/20 text-white mx-auto">
                <Wrench className="w-4 h-4" />
              </div>
            )}

            {isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                title="Thu gọn Sidebar"
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tools Menu */}
          <div className="space-y-1.5">
            {isSidebarOpen && <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2.5 mb-2">Công cụ hệ thống</div>}
            {toolsList.map((tool) => {
              const Icon = tool.icon;
              const isCurrent = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => tool.active && setActiveTool(tool.id)}
                  title={!isSidebarOpen ? tool.name : undefined}
                  className={`w-full text-left p-2.5 rounded-xl transition duration-150 flex items-center ${
                    isSidebarOpen ? "justify-between" : "justify-center"
                  } group relative ${
                    isCurrent
                      ? "bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-sm shadow-sky-500/5"
                      : tool.active
                        ? "hover:bg-zinc-800/60 text-zinc-300"
                        : "opacity-40 cursor-not-allowed text-zinc-500"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? "text-sky-400" : "text-zinc-400"}`} />
                    {isSidebarOpen && (
                      <div className="truncate">
                        <div className="text-xs font-medium truncate">{tool.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{tool.desc}</div>
                      </div>
                    )}
                  </div>
                  {isSidebarOpen &&
                    (isCurrent ? (
                      <ChevronRight className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50 shrink-0">
                        {tool.badge}
                      </span>
                    ))}
                  {/* Left Active Bar Highlight */}
                  {isCurrent && <div className="absolute left-0 top-2 bottom-2 w-1 bg-sky-400 rounded-r-full shadow-sm shadow-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        {isSidebarOpen ? (
          <div className="px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>Nova Base UI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Online"></span>
          </div>
        )}
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/40">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Mở rộng Sidebar"
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition mr-1"
              >
                <PanelLeftOpen className="w-4.5 h-4.5 text-sky-400" />
              </button>
            )}
            <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              {activeTool === "pack-stories-pdf" ? <FileText className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                {activeTool === "pack-stories-pdf" ? "Story PDF Packer" : "Batch Import ZIP Packer"}
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {activeTool === "pack-stories-pdf" ? "PDF Generator" : "ZIP / CSV Generator"}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {activeTool === "pack-stories-pdf"
                  ? "Nén từng truyện thành 1 file PDF (hỗ trợ Volume / Chapter / Ảnh)"
                  : "Quét thư mục truyện & xuất ZIP / CSV chuẩn server"}
              </p>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 flex-1 min-h-0 overflow-hidden">
          {/* Left Panel - Setup Form */}
          <div className="flex flex-col space-y-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 overflow-y-auto shadow-2xl backdrop-blur-md">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200 pb-2.5 border-b border-zinc-800/80">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>Cấu hình {activeTool === "pack-stories-pdf" ? "tạo PDF" : "đóng gói ZIP"}</span>
            </div>

            {/* Source Directory */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
                Thư mục truyện nguồn (Source Directory)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={sourceDir}
                  placeholder="Chưa chọn thư mục..."
                  className="flex-1 bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition"
                />
                <button
                  type="button"
                  onClick={handleSelectSource}
                  className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700/50 transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  Browse...
                </button>
              </div>
            </div>

            {/* Output Path / Directory */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                  {activeTool === "pack-stories-pdf" ? "Thư mục xuất file PDF" : "Vị trí xuất file ZIP / CSV"}
                </label>
                <span className="text-[10px] text-sky-400/80 font-mono">{activeTool === "pack-stories-pdf" ? "1 PDF / Story" : "Mặc định: Downloads"}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeTool === "pack-stories-pdf" ? pdfOutputDir : outputPath}
                  onChange={(e) => (activeTool === "pack-stories-pdf" ? setPdfOutputDir(e.target.value) : setOutputPath(e.target.value))}
                  placeholder="Đang tải đường dẫn mặc định..."
                  className="flex-1 bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition"
                />
                <button
                  type="button"
                  onClick={handleSelectSave}
                  className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700/50 transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  {activeTool === "pack-stories-pdf" ? "Đổi thư mục..." : "Đổi vị trí..."}
                </button>
              </div>
            </div>

            {/* Pack Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Chế độ phát hiện & đóng gói (Pack Mode)
              </label>
              <select
                value={packMode}
                onChange={(e) => setPackMode(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition"
              >
                <option value="auto">Auto</option>
                <option value="single">1 Truyện duy nhất (Thư mục đang chọn chính là 1 truyện)</option>
                <option value="batch">Hàng loạt nhiều truyện (Thư mục chứa nhiều truyện bên trong)</option>
              </select>
            </div>

            {/* Filter & Options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  Lọc tên truyện
                </label>
                <input
                  type="text"
                  value={storyFilter}
                  onChange={(e) => setStoryFilter(e.target.value)}
                  placeholder="VD: Solo Leveling"
                  className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition"
                />
              </div>

              {activeTool === "pack-stories-zip" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <FileArchive className="w-3.5 h-3.5 text-zinc-400" />
                    Mức nén ZIP
                  </label>
                  <select
                    value={compressionLevel}
                    onChange={(e) => setCompressionLevel(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition"
                  >
                    <option value="0">0 - Store (Siêu tốc)</option>
                    <option value="1">1 - Fast (Mặc định)</option>
                    <option value="6">6 - Standard</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    Định dạng đầu ra
                  </label>
                  <div className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-sky-400 font-medium">
                    PDF Document (.pdf)
                  </div>
                </div>
              )}
            </div>

            {/* Limits Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  Giới hạn số truyện
                </label>
                <input
                  type="number"
                  min="0"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="0 = Tất cả"
                  className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Giới hạn Chapter / Truyện</label>
                <input
                  type="number"
                  min="1"
                  value={chapterLimit}
                  onChange={(e) => setChapterLimit(e.target.value)}
                  placeholder="Trống = Tất cả"
                  className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition"
                />
              </div>
            </div>

            {/* Checkbox Modes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100 transition">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-sky-500 focus:ring-sky-500/40 focus:ring-offset-zinc-950 accent-sky-500"
                />
                <span>Mô phỏng (Dry-run)</span>
              </label>

              {activeTool === "pack-stories-zip" && (
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100 transition">
                  <input
                    type="checkbox"
                    checked={csvOnly}
                    onChange={(e) => setCsvOnly(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-sky-500 focus:ring-sky-500/40 focus:ring-offset-zinc-950 accent-sky-500"
                  />
                  <span>Chỉ tạo CSV</span>
                </label>
              )}
            </div>

            {/* Action Button */}
            <button
              type="button"
              disabled={isPacking}
              onClick={handleStartPack}
              className="w-full mt-auto py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:from-sky-600 active:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPacking ? "Đang xử lý..." : activeTool === "pack-stories-pdf" ? "BẮT ĐẦU TẠO FILE PDF" : "BẮT ĐẦU ĐÓNG GÓI ZIP"}</span>
            </button>

            {/* Realtime Progress Card */}
            {isPacking || progress.percent > 0 ? (
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-2 mt-2 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-sky-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                    {progress.task || "Đang xử lý..."}
                  </span>
                  <span className="font-mono text-zinc-400 font-bold">{Math.round(progress.percent)}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-800/50">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm shadow-sky-400/50"
                    style={{ width: `${progress.percent}%` }}
                  ></div>
                </div>
              </div>
            ) : null}

            {/* Success Action Notification with Open Folder Button */}
            {isFinished && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-3 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center space-x-2.5 text-emerald-400 font-medium text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hoàn tất xử lý! Các tập tin đã sẵn sàng.</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition duration-150 flex items-center justify-center space-x-2 shadow-md shadow-emerald-950/40"
                >
                  <FolderCheck className="w-4 h-4" />
                  <span>📂 MỞ THƯ MỤC CHỨA FILE</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Terminal Live Logs */}
          <div className="flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Nhật ký tiến trình (Live Logs)</span>
              </div>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700/50 transition flex items-center gap-1 shadow-sm"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>

            {/* Terminal Box */}
            <div className="flex-1 bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-y-auto whitespace-pre-wrap leading-relaxed space-y-1 shadow-inner">
              {logs.map((log, idx) => (
                <div key={idx} className="break-all">
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
