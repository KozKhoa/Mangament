import api from "@/lib/axios";
import axios from "axios";
import { handleAxiosError } from "@/utils/error";

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export interface ChunkUploadProgress {
  percent: number;
  uploadedBytes: number;
  totalBytes: number;
  speed: string; // e.g. "10.5 MB/s"
  currentChunk: number;
  totalChunks: number;
  etaSeconds: number;
}

export type ChunkUploadStatus = "idle" | "initializing" | "resuming" | "uploading" | "paused" | "retrying" | "merging" | "completed" | "error";

export interface StoryImportTemplateResult {
  success: boolean;
  message?: string;
}

/**
 * Tải file bảng tính (.csv, .xlsx, .xls) lên server để import truyện hàng loạt
 */
export async function importStoriesSpreadsheet(file: File): Promise<ServiceResult<{ fileName: string; totalRows: number }>> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/admin/stories", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2 minutes
    });

    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

/**
 * Tải file Excel mẫu (.xlsx) hướng dẫn cấu trúc các cột để import truyện
 */
export async function downloadStoryImportTemplate(): Promise<StoryImportTemplateResult> {
  try {
    const res = await api.get("/admin/stories/import-template", {
      responseType: "blob",
    });

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "stories_import_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  } catch (error: unknown) {
    console.error("Lỗi khi tải template import:", error);
    return { success: false, message: "Không thể tải file mẫu. Vui lòng thử lại sau." };
  }
}

/**
 * Khởi tạo phiên Chunked Upload cho file ZIP
 */
export async function initStoryZipChunk({
  fileName,
  fileSize,
  totalChunks,
  chunkSize,
  fileHash,
}: {
  fileName: string;
  fileSize: number;
  totalChunks: number;
  chunkSize?: number;
  fileHash?: string;
}): Promise<
  ServiceResult<{
    sessionId: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    chunkSize: number;
    uploadedChunks: number[];
    isResumed: boolean;
  }>
> {
  try {
    const res = await api.post("/admin/stories/upload-zip/chunk/init", {
      fileName,
      fileSize,
      totalChunks,
      chunkSize,
      fileHash,
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

/**
 * Lấy trạng thái phiên tải lên và danh sách các chunk đã tải (hỗ trợ Resume)
 */
export async function getStoryZipChunkStatus(sessionId: string): Promise<
  ServiceResult<{
    sessionId: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    chunkSize: number;
    uploadedChunks: number[];
    missingChunks: number[];
    uploadedCount: number;
    isComplete: boolean;
  }>
> {
  try {
    const res = await api.get("/admin/stories/upload-zip/chunk/status", {
      params: { sessionId },
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

/**
 * Tải lên 1 chunk nhị phân
 */
export async function uploadStoryZipChunk({
  sessionId,
  chunkIndex,
  chunk,
  signal,
  onProgress,
}: {
  sessionId: string;
  chunkIndex: number;
  chunk: Blob;
  signal?: AbortSignal;
  onProgress?: (loadedBytes: number, totalBytes: number) => void;
}): Promise<
  ServiceResult<{
    chunkIndex: number;
    uploadedCount: number;
    totalChunks: number;
  }>
> {
  try {
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("chunkIndex", chunkIndex.toString());
    formData.append("chunk", chunk);

    const res = await api.post("/admin/stories/upload-zip/chunk/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
      signal,
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(e.loaded, e.total);
        }
      },
    });

    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

/**
 * Yêu cầu server ghép các chunk thành file ZIP hoàn chỉnh và đẩy vào worker
 */
export async function completeStoryZipChunk({ sessionId }: { sessionId: string }): Promise<
  ServiceResult<{
    sessionId: string;
    fileName: string;
    fileSize: number;
    zipPath: string;
  }>
> {
  try {
    const res = await api.post(
      "/admin/stories/upload-zip/chunk/complete",
      {
        sessionId,
      },
      {
        timeout: 300000, // 5 minutes cho việc ghép file lớn
      },
    );
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

/**
 * Tải file zip từ một đường dẫn URL bên ngoài
 */
export async function downloadStoryZipFromUrl({ url }: { url: string }): Promise<
  ServiceResult<{
    url: string;
    fileName: string;
    fileSize: number;
  }>
> {
  try {
    const res = await api.post("/admin/stories/download-zip", {
      url,
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

/**
 * Quản lý toàn bộ vòng đời tải lên file ZIP theo từng chunk với cơ chế:
 * - Cắt file 10MB mượt mà
 * - Lưu phiên vào localStorage để khôi phục khi F5
 * - Tự động retry khi rớt mạng
 * - Tính toán tốc độ (MB/s) và thời gian ước tính (ETA)
 * - Hỗ trợ Pause / Resume / Cancel qua AbortController
 */
export async function uploadStoryZipResumable({
  file,
  chunkSize = 10 * 1024 * 1024, // 10MB mặc định
  abortController,
  onProgress,
  onStatusChange,
}: {
  file: File;
  chunkSize?: number;
  abortController?: AbortController;
  onProgress?: (progress: ChunkUploadProgress) => void;
  onStatusChange?: (status: ChunkUploadStatus, message?: string) => void;
}): Promise<ServiceResult<{ sessionId: string; fileName: string; fileSize: number; zipPath?: string }>> {
  const fileId = `${file.name}_${file.size}_${file.lastModified}`;
  const storageKey = `mangament_chunk_upload_${fileId}`;
  const totalChunks = Math.ceil(file.size / chunkSize);

  let sessionId = "";
  let uploadedChunks = new Set<number>();

  onStatusChange?.("initializing", "Đang khởi tạo phiên tải lên...");

  // 1. Kiểm tra session dở dang trong localStorage
  const cachedSessionStr = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
  if (cachedSessionStr) {
    try {
      const parsed = JSON.parse(cachedSessionStr);
      if (parsed.sessionId) {
        onStatusChange?.("resuming", "Đang kiểm tra tiến trình đã có trên server...");
        const statusRes = await getStoryZipChunkStatus(parsed.sessionId);
        if (statusRes.success && statusRes.data) {
          sessionId = parsed.sessionId;
          uploadedChunks = new Set(statusRes.data.uploadedChunks || []);
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  // 2. Nếu chưa có session hợp lệ -> Gọi API init
  if (!sessionId) {
    const initRes = await initStoryZipChunk({
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      chunkSize,
      fileHash: fileId,
    });

    if (!initRes.success || !initRes.data) {
      onStatusChange?.("error", initRes.message || "Không thể khởi tạo phiên tải lên.");
      return { success: false, message: initRes.message || "Không thể khởi tạo phiên tải lên." };
    }

    sessionId = initRes.data.sessionId;
    uploadedChunks = new Set(initRes.data.uploadedChunks || []);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          sessionId,
          fileName: file.name,
          fileSize: file.size,
          totalChunks,
        }),
      );
    }
  }

  onStatusChange?.("uploading", `Đang tải lên các phần (${uploadedChunks.size}/${totalChunks})...`);

  // Tính toán dung lượng đã tải ban đầu
  let totalUploadedBytes = 0;
  for (let i = 0; i < totalChunks; i++) {
    if (uploadedChunks.has(i)) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      totalUploadedBytes += end - start;
    }
  }

  const startTime = Date.now();
  let bytesUploadedInSession = 0;

  // 3. Vòng lặp tải từng chunk
  for (let i = 0; i < totalChunks; i++) {
    if (uploadedChunks.has(i)) continue;

    if (abortController?.signal?.aborted) {
      onStatusChange?.("paused", "Đã tạm dừng tải lên");
      return { success: false, message: "Đã tạm dừng tải lên" };
    }

    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkLength = end - start;
    const chunkBlob = file.slice(start, end);

    let chunkUploaded = false;
    let retries = 0;
    const maxRetries = 5;

    while (!chunkUploaded) {
      if (abortController?.signal?.aborted) {
        onStatusChange?.("paused", "Đã tạm dừng tải lên");
        return { success: false, message: "Đã tạm dừng tải lên" };
      }

      try {
        const uploadRes = await uploadStoryZipChunk({
          sessionId,
          chunkIndex: i,
          chunk: chunkBlob,
          signal: abortController?.signal,
        });

        if (!uploadRes.success) {
          throw new Error(uploadRes.message || `Lỗi tải chunk ${i}`);
        }

        chunkUploaded = true;
        uploadedChunks.add(i);
        totalUploadedBytes += chunkLength;
        bytesUploadedInSession += chunkLength;

        // Tính tốc độ và ETA
        const elapsedSec = (Date.now() - startTime) / 1000 || 0.1;
        const speedBytesPerSec = bytesUploadedInSession / elapsedSec;
        const speedMBs = (speedBytesPerSec / (1024 * 1024)).toFixed(1);
        const remainingBytes = Math.max(0, file.size - totalUploadedBytes);
        const etaSeconds = speedBytesPerSec > 0 ? Math.round(remainingBytes / speedBytesPerSec) : 0;
        const percent = Math.min(100, Math.round((totalUploadedBytes / file.size) * 100));

        onProgress?.({
          percent,
          uploadedBytes: totalUploadedBytes,
          totalBytes: file.size,
          speed: `${speedMBs} MB/s`,
          currentChunk: i + 1,
          totalChunks,
          etaSeconds,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (axios.isCancel(err) || abortController?.signal?.aborted) {
          onStatusChange?.("paused", "Đã tạm dừng tải lên");
          return { success: false, message: "Đã tạm dừng tải lên" };
        }

        retries++;
        if (retries > maxRetries) {
          onStatusChange?.("error", `Không thể tải phần ${i + 1} sau ${maxRetries} lần thử: ${errorMsg}`);
          return { success: false, message: `Lỗi kết nối khi tải phần ${i + 1}` };
        }

        onStatusChange?.("retrying", `Mất kết nối tại phần ${i + 1}/${totalChunks}. Đang thử lại lần ${retries}...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        onStatusChange?.("uploading", `Đang tải lại phần ${i + 1}/${totalChunks}...`);
      }
    }
  }

  // 4. Ghép file trên server
  onStatusChange?.("merging", "Đã tải đủ 100%. Đang ghép các phần thành file ZIP trên server...");

  const completeRes = await completeStoryZipChunk({
    sessionId,
  });

  if (!completeRes.success) {
    onStatusChange?.("error", completeRes.message || "Lỗi khi ghép file trên server.");
    return { success: false, message: completeRes.message || "Lỗi khi ghép file trên server." };
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(storageKey);
  }

  onStatusChange?.("completed", "Tải lên và ghép file ZIP thành công! Hệ thống đang xử lý import.");

  return {
    success: true,
    message: completeRes.message,
    data: {
      sessionId,
      fileName: file.name,
      fileSize: file.size,
      zipPath: completeRes.data?.zipPath,
    },
  };
}

const storyImportService = {
  importStoriesSpreadsheet,
  downloadStoryImportTemplate,
  initStoryZipChunk,
  getStoryZipChunkStatus,
  uploadStoryZipChunk,
  completeStoryZipChunk,
  downloadStoryZipFromUrl,
  uploadStoryZipResumable,
};

export default storyImportService;
