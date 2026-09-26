"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import withAdmin from "@/hoc/withAdmin";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import ManualStoryForm from "./components/ManualStoryForm";
import SpreadsheetImportTab from "./components/SpreadsheetImportTab";
import ZipImportTab from "./components/ZipImportTab";

type ImportTabType = "manual" | "spreadsheet" | "zip";

export function AddNewStoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ImportTabType>("manual");

  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 px-1 sm:px-4 flex flex-col gap-6">
      {/* Top bar with back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-md hover:bg-foreground/5 text-lg transition-colors cursor-pointer"
            title="Quay lại"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Thêm truyện mới</h1>
            <p className="text-xs opacity-60">Chọn phương thức nhập dữ liệu truyện phù hợp với nhu cầu của bạn</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-background-items rounded-lg border border-foreground/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "manual" ? "bg-foreground text-background-items shadow-sm" : "opacity-70 hover:opacity-100"
            }`}
          >
            ✍️ Nhập thủ công
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("spreadsheet")}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "spreadsheet" ? "bg-foreground text-background-items shadow-sm" : "opacity-70 hover:opacity-100"
            }`}
          >
            📊 Bảng tính (Excel/CSV)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("zip")}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "zip" ? "bg-foreground text-background-items shadow-sm" : "opacity-70 hover:opacity-100"
            }`}
          >
            📦 Gói nén ZIP (File lớn)
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="w-full">
        {activeTab === "manual" && <ManualStoryForm />}
        {activeTab === "spreadsheet" && <SpreadsheetImportTab />}
        {activeTab === "zip" && <ZipImportTab />}
      </div>
    </div>
  );
}

export default withAdmin(AddNewStoryPage);
