"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import Button from "@/components/buttons/button";
import adminService, { ChunkUploadProgress, ChunkUploadStatus } from "@/services/admin";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatSeconds(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return "Đang tính...";
  if (seconds < 60) return `~${seconds} giây`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `~${mins} phút ${remainingSecs}s`;
}

export default function ZipImportTab() {
  const [zipMethod, setZipMethod] = useState<"chunk" | "url">("chunk");

  // State cho Chunked Upload từ máy
  const [file, setFile] = useState<File | null>(null);
  const [cleanupAfterProcessing, setCleanupAfterProcessing] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<ChunkUploadStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [progress, setProgress] = useState<ChunkUploadProgress>({
    percent: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    speed: "0 MB/s",
    currentChunk: 0,
    totalChunks: 0,
    etaSeconds: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // State cho URL Download
  const [remoteUrl, setRemoteUrl] = useState("");
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(false);

  // Dropzone cho file .zip
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: {
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    maxFiles: 1,
    disabled: uploadStatus === "uploading" || uploadStatus === "merging",
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selected = acceptedFiles[0];
        setFile(selected);
        setUploadStatus("idle");
        setStatusMessage("");
        setProgress({
          percent: 0,
          uploadedBytes: 0,
          totalBytes: selected.size,
          speed: "0 MB/s",
          currentChunk: 0,
          totalChunks: Math.ceil(selected.size / (10 * 1024 * 1024)),
          etaSeconds: 0,
        });

        // Kiểm tra xem file này có phiên upload dở trước đó không
        const fileId = `${selected.name}_${selected.size}_${selected.lastModified}`;
        const cached = localStorage.getItem(`mangament_chunk_upload_${fileId}`);
        if (cached) {
          toast.info("Phát hiện file này từng tải dở. Bạn có thể nhấn 'Tiếp tục' để tải tiếp!");
        }
      }
    },
  });

  // Hủy upload khi component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Xử lý Bắt đầu / Tiếp tục upload
  async function handleStartUpload() {
    if (!file) {
      toast.warning("Vui lòng chọn một file ZIP");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setUploadStatus("uploading");

    const res = await adminService.uploadStoryZipResumable({
      file,
      chunkSize: 10 * 1024 * 1024, // 10MB
      cleanupAfterProcessing,
      abortController: controller,
      onProgress: (p) => {
        setProgress(p);
      },
      onStatusChange: (status, msg) => {
        setUploadStatus(status);
        if (msg) setStatusMessage(msg);
      },
    });

    if (!res.success) {
      if (uploadStatus !== "paused") {
        toast.error(res.message || "Tải lên file ZIP thất bại");
      }
      return;
    }

    toast.success("File ZIP đã được tải lên và ghép hoàn tất!");
  }

  // Tạm dừng upload
  function handlePauseUpload() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploadStatus("paused");
      setStatusMessage("Đã tạm dừng tải lên. Bạn có thể nhấn 'Tiếp tục' bất kỳ lúc nào.");
    }
  }

  // Hủy bỏ upload hoàn toàn
  function handleCancelUpload() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (file) {
      const fileId = `${file.name}_${file.size}_${file.lastModified}`;
      localStorage.removeItem(`mangament_chunk_upload_${fileId}`);
    }
    setFile(null);
    setUploadStatus("idle");
    setStatusMessage("");
    setProgress({
      percent: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      speed: "0 MB/s",
      currentChunk: 0,
      totalChunks: 0,
      etaSeconds: 0,
    });
    toast.message("Đã hủy phiên upload");
  }

  // Xử lý tải qua URL
  async function handleDownloadFromUrl() {
    if (!remoteUrl.trim()) {
      toast.warning("Vui lòng nhập đường dẫn URL file ZIP");
      return;
    }

    try {
      new URL(remoteUrl);
    } catch {
      toast.error("Đường dẫn URL không hợp lệ");
      return;
    }

    setIsDownloadingUrl(true);
    const res = await adminService.downloadStoryZipFromUrl({
      url: remoteUrl.trim(),
      cleanupAfterProcessing,
    });
    setIsDownloadingUrl(false);

    if (!res.success) {
      toast.error(res.message || "Yêu cầu tải file từ URL thất bại");
      return;
    }

    toast.success("Server đã tiếp nhận URL và đang tải file zip trong nền!");
    setRemoteUrl("");
  }

  // Màu sắc của thanh tiến trình theo trạng thái
  function getProgressBarColor() {
    switch (uploadStatus) {
      case "retrying":
        return "bg-amber-500";
      case "merging":
        return "bg-purple-600";
      case "completed":
        return "bg-green-600";
      case "paused":
        return "bg-foreground/40";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-600";
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Tab chuyển đổi phương thức ZIP: Upload từ máy vs Tải từ URL */}
      <div className="flex items-center gap-2 p-1 bg-background-items rounded-lg border border-foreground/10 self-center">
        <button
          type="button"
          onClick={() => setZipMethod("chunk")}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            zipMethod === "chunk" ? "bg-foreground text-background-items shadow-sm" : "opacity-70 hover:opacity-100"
          }`}
        >
          💻 Tải lên từ máy tính (Chunked / File lớn)
        </button>

        <button
          type="button"
          onClick={() => setZipMethod("url")}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            zipMethod === "url" ? "bg-foreground text-background-items shadow-sm" : "opacity-70 hover:opacity-100"
          }`}
        >
          🌐 Tải qua URL trực tuyến (Remote Download)
        </button>
      </div>

      {/* PHƯƠNG THỨC 1: TẢI TỪ MÁY TÍNH (CHUNKED UPLOAD) */}
      {zipMethod === "chunk" && (
        <div className="flex flex-col gap-5">
          {/* Thông tin tính năng */}
          <div className="bg-background-items border border-foreground/10 rounded-lg p-4 text-sm space-y-1.5 opacity-90 leading-relaxed">
            <p className="font-semibold text-base">Cơ chế Chunked & Resumable Upload</p>
            <p className="text-xs opacity-75">
              File ZIP được tự động cắt thành các phần 10MB để tải lên. Nếu mạng bị ngắt hoặc bạn tải lại trang (F5), hệ thống sẽ tự động khôi phục và tiếp tục
              từ phần còn thiếu mà không phải tải lại từ đầu.
            </p>
          </div>

          {/* Khung Dropzone */}
          {uploadStatus === "idle" && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3
              ${isDragActive ? "border-blue-600 bg-blue-50/10" : "border-foreground/20 hover:border-foreground/40 bg-background-items/50"}`}
            >
              <input {...getInputProps()} />

              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-3xl">📦</div>

              {isDragActive ? (
                <p className="text-blue-500 font-semibold text-base">Thả file ZIP vào đây...</p>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-base">Kéo & thả file ZIP truyện vào đây, hoặc click để chọn file</p>
                  <p className="text-xs opacity-60">Hỗ trợ file nén .ZIP dung lượng lớn (100MB, 2GB, 5GB+)</p>
                </div>
              )}
            </div>
          )}

          {fileRejections.length > 0 && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-sm">⚠️ Chỉ chấp nhận file nén định dạng .zip</div>
          )}

          {/* Dashboard tiến trình Upload khi có file */}
          {file && (
            <div className="bg-background-items border border-foreground/10 rounded-lg p-5 flex flex-col gap-4">
              {/* Header file info */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-3xl shrink-0">📦</span>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-base truncate">{file.name}</p>
                    <p className="text-xs opacity-60">
                      Tổng dung lượng: <span className="font-semibold">{formatBytes(file.size)}</span> • Khoảng{" "}
                      <span className="font-semibold">{Math.ceil(file.size / (10 * 1024 * 1024))} chunks</span> (10MB/chunk)
                    </p>
                  </div>
                </div>

                {uploadStatus === "idle" && (
                  <button
                    type="button"
                    className="text-xs font-semibold px-3 py-1.5 rounded border border-foreground/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors shrink-0"
                    onClick={handleCancelUpload}
                  >
                    Đổi file khác
                  </button>
                )}
              </div>

              {/* Thanh Progress Bar */}
              {uploadStatus !== "idle" && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-base">{progress.percent}%</span>
                    <span className="text-xs opacity-75">{statusMessage}</span>
                  </div>

                  <div className="w-full bg-foreground/10 rounded-full h-3 overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${getProgressBarColor()}`} style={{ width: `${progress.percent}%` }} />
                  </div>

                  {/* Chỉ số tốc độ, dung lượng, ETA */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs opacity-80 text-center sm:text-left">
                    <div className="bg-foreground/5 p-2 rounded">
                      <p className="opacity-60">Đã tải lên</p>
                      <p className="font-semibold text-sm">
                        {formatBytes(progress.uploadedBytes)} / {formatBytes(file.size)}
                      </p>
                    </div>

                    <div className="bg-foreground/5 p-2 rounded">
                      <p className="opacity-60">Tốc độ</p>
                      <p className="font-semibold text-sm">{progress.speed}</p>
                    </div>

                    <div className="bg-foreground/5 p-2 rounded">
                      <p className="opacity-60">Thời gian còn lại</p>
                      <p className="font-semibold text-sm">{formatSeconds(progress.etaSeconds)}</p>
                    </div>

                    <div className="bg-foreground/5 p-2 rounded">
                      <p className="opacity-60">Tiến độ phần</p>
                      <p className="font-semibold text-sm">
                        {progress.currentChunk} / {progress.totalChunks} chunks
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tùy chọn cleanup */}
              {uploadStatus === "idle" && (
                <label className="flex items-center gap-2 text-xs opacity-80 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={cleanupAfterProcessing}
                    onChange={(e) => setCleanupAfterProcessing(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tự động xóa file ZIP trên server sau khi worker hoàn tất giải nén và import</span>
                </label>
              )}

              {/* Nhóm nút điều khiển */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-foreground/10">
                {uploadStatus === "idle" && (
                  <Button buttonType="default" className="flex-1 py-2.5 font-semibold text-sm" onClick={handleStartUpload}>
                    🚀 Bắt đầu Tải lên (Chunked Upload)
                  </Button>
                )}

                {uploadStatus === "uploading" && (
                  <>
                    <Button buttonType="default" className="flex-1 py-2.5 font-semibold text-sm bg-amber-600 hover:bg-amber-700" onClick={handlePauseUpload}>
                      ⏸️ Tạm dừng tải lên
                    </Button>
                    <Button buttonType="delete" className="py-2.5 px-4 font-semibold text-sm" onClick={handleCancelUpload}>
                      Hủy bỏ
                    </Button>
                  </>
                )}

                {uploadStatus === "paused" && (
                  <>
                    <Button buttonType="default" className="flex-1 py-2.5 font-semibold text-sm" onClick={handleStartUpload}>
                      ▶️ Tiếp tục tải lên
                    </Button>
                    <Button buttonType="delete" className="py-2.5 px-4 font-semibold text-sm" onClick={handleCancelUpload}>
                      Hủy bỏ
                    </Button>
                  </>
                )}

                {uploadStatus === "completed" && (
                  <Button
                    buttonType="default"
                    className="w-full py-2.5 font-semibold text-sm bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setFile(null);
                      setUploadStatus("idle");
                      setStatusMessage("");
                    }}
                  >
                    🎉 Tải lên gói truyện khác
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHƯƠNG THỨC 2: TẢI TỪ URL TRỰC TUYẾN */}
      {zipMethod === "url" && (
        <div className="bg-background-items border border-foreground/10 rounded-lg p-6 flex flex-col gap-4">
          <div>
            <h4 className="font-semibold text-base mb-1">Tải file ZIP trực tiếp từ URL bên ngoài</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Dành cho các file ZIP dung lượng lớn lưu trên Google Drive, Cloudflare R2, MinIO, AWS S3 hoặc server riêng. Server sẽ tự động tải stream về trong
              nền mà không tốn băng thông máy của bạn.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold opacity-90">Đường dẫn URL tải file (.zip)</label>
            <input
              type="url"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://example.com/storage/stories_batch_2026.zip"
              className="w-full px-3.5 py-2.5 rounded border border-foreground/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs opacity-80 cursor-pointer">
            <input
              type="checkbox"
              checked={cleanupAfterProcessing}
              onChange={(e) => setCleanupAfterProcessing(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Tự động xóa file ZIP sau khi xử lý giải nén xong</span>
          </label>

          <div className="pt-2">
            <Button
              buttonType="default"
              className="w-full py-2.5 font-semibold text-sm"
              disable={!remoteUrl.trim() || isDownloadingUrl}
              isProcessing={isDownloadingUrl}
              onClick={handleDownloadFromUrl}
            >
              {isDownloadingUrl ? "Đang gửi yêu cầu cho server..." : "📥 Yêu cầu Server Tải về & Import"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
