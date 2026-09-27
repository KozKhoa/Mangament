"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import Button from "@/components/buttons/button";
import adminService from "@/services/admin";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default function SpreadsheetImportTab() {
  const [file, setFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ fileName: string; totalRows: number } | null>(null);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setImportResult(null);
      }
    },
  });

  // Tải file mẫu
  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    const res = await adminService.downloadStoryImportTemplate();
    setIsDownloadingTemplate(false);

    if (res.success) {
      toast.success("Đã tải xuống file mẫu thành công!");
    } else {
      toast.error(res.message || "Không thể tải file mẫu");
    }
  }

  // Thực hiện import
  async function handleImport() {
    if (!file) {
      toast.warning("Vui lòng chọn một file bảng tính (.csv, .xlsx, .xls)");
      return;
    }

    setIsImporting(true);
    const res = await adminService.importStoriesSpreadsheet(file);
    setIsImporting(false);

    if (!res.success) {
      toast.error(res.message || "Import bảng tính thất bại");
      return;
    }

    toast.success("File bảng tính đã được gửi lên hệ thống thành công!");
    if (res.data) {
      setImportResult({
        fileName: res.data.fileName,
        totalRows: res.data.totalRows,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Khối hướng dẫn và tải template */}
      <div className="bg-background-items border border-foreground/10 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base mb-1">Cấu trúc bảng tính nhập truyện</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Hỗ trợ định dạng <span className="font-mono font-medium">.csv, .xlsx, .xls</span> (tối đa 20MB). Bảng tính bao gồm các cột: Tiêu đề, Tóm tắt, Trạng
            thái, Thể loại, Tác giả và danh sách Chương.
          </p>
        </div>

        <Button
          type="button"
          buttonType="add"
          className="whitespace-nowrap px-4 py-2 shrink-0 text-sm font-medium"
          isProcessing={isDownloadingTemplate}
          onClick={handleDownloadTemplate}
        >
          📥 Tải file mẫu (.xlsx)
        </Button>
      </div>

      {/* Khu vực Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3
        ${isDragActive ? "border-blue-600 bg-blue-50/10" : "border-foreground/20 hover:border-foreground/40 bg-background-items/50"}`}
      >
        <input {...getInputProps()} />

        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-3xl">📊</div>

        {isDragActive ? (
          <p className="text-blue-500 font-semibold text-base">Thả file bảng tính vào đây...</p>
        ) : (
          <div className="space-y-1">
            <p className="font-semibold text-base">Kéo & thả file bảng tính vào đây, hoặc click để chọn file</p>
            <p className="text-xs opacity-60">Hỗ trợ .CSV, .XLSX, .XLS (Dung lượng tối đa 20MB)</p>
          </div>
        )}
      </div>

      {/* Báo lỗi nếu file vượt quá 20MB hoặc sai định dạng */}
      {fileRejections.length > 0 && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          ⚠️ File không hợp lệ: Vui lòng đảm bảo file có đuôi .csv, .xlsx, .xls và dung lượng dưới 20MB.
        </div>
      )}

      {/* Thông tin file đã chọn */}
      {file && (
        <div className="bg-background-items border border-foreground/10 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-2xl shrink-0">📄</span>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{file.name}</p>
              <p className="text-xs opacity-60">{formatBytes(file.size)}</p>
            </div>
          </div>

          <button
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded border border-foreground/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              setImportResult(null);
            }}
          >
            Đổi file khác
          </button>
        </div>
      )}

      {/* Kết quả sau khi import */}
      {importResult && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 space-y-1">
          <p className="font-semibold text-sm">✅ Tiếp nhận dữ liệu thành công!</p>
          <p className="text-xs opacity-90">
            File <span className="font-semibold">{importResult.fileName}</span> ({importResult.totalRows} dòng truyện) đã được đưa vào hàng đợi worker để xử lý
            trong nền. Bạn có thể theo dõi danh sách truyện tại trang Quản lý truyện.
          </p>
        </div>
      )}

      {/* Nút hành động */}
      <div className="pt-2">
        <Button
          buttonType="default"
          className="w-full py-3 font-semibold text-base"
          disable={!file || isImporting}
          isProcessing={isImporting}
          onClick={handleImport}
        >
          {isImporting ? "Đang tải lên và xử lý..." : "Bắt đầu Import Bảng Tính"}
        </Button>
      </div>
    </div>
  );
}
