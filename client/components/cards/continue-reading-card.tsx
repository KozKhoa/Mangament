"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import History from "@/types/history";
import StoryNode from "@/types/story-node";
import historyService from "@/services/history";
import { routes } from "@/lib/routes";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import TrashIcon from "@/public/trash.svg";

interface ContinueReadingCardProps {
  history: History;
  onClickRemove?: () => void;
  className?: string;
}

function formatRelativeTime(dateInput?: Date | string) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function getChapterDisplayName(node?: StoryNode): string {
  if (!node) return "Chương đọc";
  const typeStr = snakeCaseToCapitalizeWord(node.type || "Chương");
  const order = node.order_index ?? "";
  const title = node.title ? `: ${node.title}` : "";
  return `${typeStr} ${order}${title}`;
}

export default function ContinueReadingCard({ history, onClickRemove, className = "" }: ContinueReadingCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const story = history?.story;
  const currentChapter = history?.story_node;

  // Tính toán tiến trình đọc
  const { progressPercentage, currentOrder, totalChapters } = useMemo(() => {
    const total = story?.number_of_children || story?.children?.length || 0;
    const current = currentChapter?.order_index ?? 0;
    const percentage = total > 0 ? Math.min(100, Math.max(1, Math.round((current / total) * 100))) : null;

    return {
      progressPercentage: percentage,
      currentOrder: current,
      totalChapters: total,
    };
  }, [story?.number_of_children, story?.children, currentChapter?.order_index]);

  function navigateToStoryNode() {
    if (!story?.id || !story?.type || !currentChapter?.id) return;
    router.push(routes.storyNode({ storyType: story.type, storyId: story.id, storyNodeId: currentChapter.id }));
  }

  function navigateToStory(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!story?.id || !story?.type) return;
    router.push(routes.story({ storyType: story.type, storyId: story.id }));
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    if (deleting) return;

    setDeleting(true);
    try {
      const res = await historyService.removeHistory(history.id);
      if (!res.success) {
        toast.warning(res.message);
        return;
      }
      toast.message(`Đã xóa "${story?.title}" khỏi lịch sử đọc`);
      onClickRemove?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa lịch sử";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      onClick={navigateToStoryNode}
      className={`group relative flex flex-row items-stretch overflow-hidden rounded-lg border-foreground/15 
        bg-background-items text-foreground shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer
        w-full min-h-[220px] sm:min-h-[240px] md:min-h-[260px] lg:min-h-[270px]
        md:aspect-[2/1] ${className}`}
    >
      {/* CỘT TRÁI: COVER ART (Chiếm ~35% chiều rộng, kích thước to rõ, tỉ lệ chuẩn bìa truyện) */}
      <div className="relative self-stretch w-[35%] sm:w-[33%] md:w-[35%] shrink-0 overflow-hidden bg-foreground/5 min-h-[220px] sm:min-h-[240px] md:min-h-[260px] lg:min-h-[270px]">
        {story?.cover_art?.path ? (
          <Image
            src={[process.env.NEXT_PUBLIC_CDN_URL, story.cover_art.path].join("")}
            alt={story.title || "Cover Art"}
            fill
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 30vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-foreground/40 italic">Không có ảnh</div>
        )}

        {/* Gradient bóng đổ chân ảnh */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

        {/* Badges dưới chân ảnh: Cờ quốc gia & Thể loại */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center gap-1.5 text-white pointer-events-none">
          {story?.nation && (
            <span className="shrink-0 drop-shadow">
              {story.nation.flag_image?.path ? (
                <Image
                  src={[process.env.NEXT_PUBLIC_CDN_URL, story.nation.flag_image.path].join("")}
                  alt={story.nation.name}
                  width={20}
                  height={14}
                  className="object-contain inline-block rounded-xs shadow"
                />
              ) : (
                <span className="text-sm">{story.nation.flag_icon}</span>
              )}
            </span>
          )}
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs drop-shadow">
            {story?.type ? snakeCaseToCapitalizeWord(story.type) : "Story"}
          </span>
        </div>

        {/* Nút Play/Đọc tiếp overlay xuất hiện khi rê chuột vào ảnh */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[0.5px]">
          <span className="w-12 h-12 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform pl-0.5 text-lg font-bold">
            ▶
          </span>
        </div>
      </div>

      {/* CỘT PHẢI: THÔNG TIN TRUYỆN & TIẾN TRÌNH (Chiếm ~65% chiều rộng, layout thông thoáng không chồng lấn) */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4 md:p-5 w-[65%] sm:w-[67%] md:w-[65%] self-stretch gap-2 overflow-hidden">
        {/* Hàng 1: Thời gian & Nút xoá khỏi lịch sử */}
        <div className="flex items-center justify-between text-xs text-foreground/60 w-full shrink-0">
          <span className="italic truncate max-w-[80%] font-medium">{formatRelativeTime(history?.updated_at)}</span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={deleting}
            title="Xóa khỏi lịch sử đọc"
            className="p-1.5 -mr-1 rounded-md hover:bg-red-500/10 hover:text-red-500 text-foreground/40 transition-colors cursor-pointer"
          >
            <TrashIcon className={`w-4 h-4 ${deleting ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Hàng 2: Tiêu đề truyện (Line clamp 2 rõ ràng, không bị chèn ép) */}
        <h3
          onClick={navigateToStory}
          title={story?.title}
          className="font-bold text-base sm:text-lg md:text-xl leading-snug line-clamp-2 hover:text-accept-button transition-colors cursor-pointer shrink-0"
        >
          {story?.title || "Truyện chưa có tiêu đề"}
        </h3>

        {/* Hàng 3: Chapter đang đọc dở */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80 font-medium truncate shrink-0">
          <span className="text-accept-button shrink-0 text-sm">📖</span>
          <span className="truncate font-semibold">{getChapterDisplayName(currentChapter)}</span>
        </div>

        {/* Hàng 4: Thanh tiến trình đọc trực quan */}
        <div className="flex flex-col gap-1.5 w-full my-auto shrink-0">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-foreground/70">Tiến trình đọc</span>
            <span className="font-bold text-accept-button whitespace-nowrap">
              {progressPercentage !== null ? (
                <>
                  {progressPercentage}%{" "}
                  {totalChapters > 0 && (
                    <span className="font-normal text-foreground/50 text-[11px] sm:text-xs">
                      ({currentOrder}/{totalChapters} ch.)
                    </span>
                  )}
                </>
              ) : (
                `Chương ${currentOrder}`
              )}
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden relative shadow-inner">
            <div className="h-full bg-accept-button rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage ?? 0}%` }} />
          </div>
        </div>

        {/* Hàng 5: Nút Tiếp tục đọc & Chi tiết (Ngăn ngừa tuyệt đối việc chữ bị rớt dòng che lấp tiêu đề) */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-foreground/10 shrink-0 mt-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToStoryNode();
            }}
            className="px-4 py-2 bg-foreground text-background-items hover:opacity-90 rounded font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>Đọc tiếp</span>
            <span className="text-xs">➤</span>
          </button>

          <span
            onClick={navigateToStory}
            className="text-xs sm:text-sm text-foreground/60 hover:text-foreground hover:underline transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Chi tiết truyện
          </span>
        </div>
      </div>
    </div>
  );
}
