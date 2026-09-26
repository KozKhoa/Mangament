"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateStoryPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên truyện!");
      return;
    }

    setSubmitting(true);
    try {
      // Sẽ kết nối trực tiếp với storyService.createStory
      toast.success("Tạo truyện thành công!");
    } catch {
      toast.error("Không thể tạo truyện, vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đăng Tác Phẩm Mới</h1>
          <p className="text-sm text-muted-foreground">Nhập các thông tin chi tiết về bộ truyện của bạn</p>
        </div>
        <Link href="/stories" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Tên bộ truyện *</label>
          <input
            type="text"
            placeholder="Ví dụ: Đại Quản Gia Là Ma Hoàng..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Tóm tắt nội dung</label>
          <textarea
            placeholder="Mô tả sơ lược về bối cảnh, nhân vật chính..."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Trạng thái phát hành</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="ongoing">Đang tiến hành (Ongoing)</option>
            <option value="completed">Đã hoàn thành (Completed)</option>
            <option value="hiatus">Tạm ngưng (Hiatus)</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Link href="/stories" className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium transition-colors">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Đang lưu..." : "Tạo tác phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}
