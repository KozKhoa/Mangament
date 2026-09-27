import Link from "next/link";

export default function AuthorDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 border border-primary/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kênh Quản Lý Tác Giả & Sáng Tác</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Chào mừng bạn đến với Studio tác giả! Nơi quản lý các bộ truyện tranh, đăng tải các chương mới và tương tác với độc giả.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/stories/create"
            className="inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-5 py-2.5 transition-all"
          >
            Đăng truyện mới
          </Link>
          <Link
            href="/stories"
            className="inline-flex items-center justify-center rounded-xl text-sm font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-5 py-2.5 transition-all"
          >
            Xem danh sách truyện
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Tổng số truyện</div>
          <div className="mt-2 text-3xl font-bold">--</div>
          <p className="mt-1 text-xs text-muted-foreground">Tác phẩm đã phát hành</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Tổng lượt đọc</div>
          <div className="mt-2 text-3xl font-bold">--</div>
          <p className="mt-1 text-xs text-muted-foreground">Lượt xem trên tất cả các chương</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Độc giả theo dõi</div>
          <div className="mt-2 text-3xl font-bold">--</div>
          <p className="mt-1 text-xs text-muted-foreground">Lượt thêm vào yêu thích</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Đánh giá trung bình</div>
          <div className="mt-2 text-3xl font-bold">-- ⭐</div>
          <p className="mt-1 text-xs text-muted-foreground">Từ cộng đồng độc giả</p>
        </div>
      </div>

      {/* Quick Action & Recent Stories */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Truyện gần đây</h2>
          <Link href="/stories" className="text-sm text-primary hover:underline font-medium">
            Tất cả truyện &rarr;
          </Link>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          Chưa có tác phẩm nào hiển thị gần đây. Bấm vào nút bên dưới để tạo tác phẩm đầu tiên của bạn!
          <div className="mt-4">
            <Link
              href="/stories/create"
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 h-9 px-4 py-2"
            >
              + Đăng truyện ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
