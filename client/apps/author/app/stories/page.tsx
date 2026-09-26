import Link from "next/link";

export default function AuthorStoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh Sách Truyện Của Tôi</h1>
          <p className="text-sm text-muted-foreground">Quản lý nội dung, cập nhật tình trạng và các chương truyện</p>
        </div>
        <Link
          href="/stories/create"
          className="inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-5 py-2.5 transition-all"
        >
          + Thêm tác phẩm mới
        </Link>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground shadow-sm">
        <p className="text-base">Bạn chưa đăng tải bộ truyện nào.</p>
        <p className="text-sm mt-1">Hãy bắt đầu chia sẻ câu chuyện tuyệt vời của bạn với hàng ngàn độc giả ngay hôm nay!</p>
        <div className="mt-5">
          <Link
            href="/stories/create"
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Đăng truyện ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
