"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import History from "@/types/history";
import ContinueReadingCard from "@/components/cards/continue-reading-card";
import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import ArrowRightIcon from "@/public/arrows/right-v.svg";
import Loading from "@/components/loadings/loading";

interface ContinueReadingBarProps {
  histories?: History[] | null;
  label?: string;
  onClickLabel?: () => void;
  onRemoveElement?: (history: History) => void;
  autoScrollInterval?: number; // thời gian auto scroll (ms), mặc định 5000ms
  className?: string;
}

export default function ContinueReadingBar({
  histories,
  label = "Tiếp tục đọc",
  onClickLabel,
  onRemoveElement,
  autoScrollInterval = 5000,
  className = "",
}: ContinueReadingBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // vị trí float index từ 0 đến total - 1
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const rafId = useRef<number | null>(null);

  const total = histories?.length || 0;

  // Tính toán vị trí cuộn liên tục (float index) để nội suy animation mượt mà
  const updateScrollProgress = useCallback(() => {
    const container = containerRef.current;
    if (!container || total <= 1) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setCurrentIndex(0);
      return;
    }

    const currentScroll = container.scrollLeft;
    const floatIdx = (currentScroll / maxScroll) * (total - 1);
    setScrollProgress(floatIdx);
    setCurrentIndex(Math.round(floatIdx));
  }, [total]);

  function handleScroll() {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      updateScrollProgress();
    });
  }

  // Cuộn mượt đến phần tử thứ index
  const scrollToIndex = useCallback(
    (index: number, smooth: boolean = true) => {
      const container = containerRef.current;
      if (!container || total <= 1) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      const targetScroll = (index / (total - 1)) * maxScroll;

      container.scrollTo({
        left: targetScroll,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [total],
  );

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    const nextIdx = (currentIndex + 1) % total;
    scrollToIndex(nextIdx);
  }, [total, currentIndex, scrollToIndex]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    const prevIdx = (currentIndex - 1 + total) % total;
    scrollToIndex(prevIdx);
  }, [total, currentIndex, scrollToIndex]);

  // Tự động cuộn theo thời gian (Auto Scroll)
  useEffect(() => {
    if (isPaused || total <= 1 || autoScrollInterval <= 0) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [isPaused, total, autoScrollInterval, handleNext]);

  // Cập nhật lại chỉ số khi resize cửa sổ
  useEffect(() => {
    const handleResize = () => updateScrollProgress();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollProgress]);

  // Trạng thái đang tải dữ liệu
  if (histories === null) {
    return (
      <div className={`flex flex-col gap-3 w-full ${className}`}>
        <div className="h-8 w-40 bg-foreground/10 rounded animate-pulse" />
        <div className="w-full min-h-[240px] rounded-lg border border-foreground/15 bg-background-items flex items-center justify-center shadow-sm">
          <Loading className="w-10 h-10" />
        </div>
      </div>
    );
  }

  // Nếu không có lịch sử đọc
  if (!histories || histories.length === 0) {
    return null;
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={`flex flex-col gap-3 w-full select-none ${className}`}
    >
      {/* HEADER BAR: Tiêu đề, bộ đếm & Nút chuyển slide */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2.5">
          <h2 onClick={onClickLabel} className={`text-xl sm:text-2xl font-bold transition-colors ${onClickLabel ? "cursor-pointer hover:underline" : ""}`}>
            {label}
          </h2>
          {total > 1 && (
            <span className="text-xs sm:text-sm font-medium px-2.5 py-0.5 rounded-full bg-foreground/10 text-foreground/70">
              {currentIndex + 1} / {total}
            </span>
          )}
        </div>

        {/* Nút bấm điều hướng & Dots */}
        {total > 1 && (
          <div className="flex items-center gap-3">
            {/* Dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {histories.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  title={`Chuyển đến truyện ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentIndex ? "w-6 bg-foreground" : "w-1.5 bg-foreground/30 hover:bg-foreground/60"
                  }`}
                />
              ))}
            </div>

            {/* Prev & Next */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                title="Truyện trước"
                className="p-1.5 sm:p-2 rounded-full border border-foreground/20 hover:bg-foreground/10 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeftIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                title="Truyện kế tiếp"
                className="p-1.5 sm:p-2 rounded-full border border-foreground/20 hover:bg-foreground/10 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <ArrowRightIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DẢI BĂNG CUỘN LIÊN TỤC (Physical Horizontal Strip)
          Người dùng có thể scroll chậm chậm, card sẽ trượt thực tế và dần dần to lên / nghiêng dần */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-row overflow-x-auto scroll-smooth py-6 px-3 sm:px-6 w-full 
          snap-x snap-mandatory gap-4 sm:gap-6 md:gap-8
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {histories.map((history, i) => {
          // Tính khoảng cách tương đối của card i so với điểm tiêu điểm (scrollProgress)
          const diff = total > 1 ? i - scrollProgress : 0;
          const clampedDiff = Math.max(-1, Math.min(1, diff));
          const absDiff = Math.abs(clampedDiff);

          // Nội suy liên tục:
          // scale: từ 0.90 (ở rìa) -> 1.0 (ở tâm tiêu điểm)
          // rotate: từ -3deg (bên trái) -> 0deg (ở tâm) -> 3deg (bên phải)
          // opacity: từ 0.70 -> 1.0
          // translateY: hạ thấp nhẹ 8px khi không active tạo chiều sâu 3D
          const scale = 1 - absDiff * 0.1;
          const rotate = clampedDiff * 3;
          const opacity = 1 - absDiff * 0.3;
          const translateY = absDiff * 8;
          const zIndex = Math.round((1 - absDiff) * 10) + 1;
          const isCurrent = Math.abs(diff) < 0.35;

          return (
            <div
              key={history.id}
              onClick={(e) => {
                // Nếu card đang ở rìa (chưa active), click sẽ cuộn mượt đưa card vào giữa
                if (!isCurrent) {
                  e.stopPropagation();
                  scrollToIndex(i);
                }
              }}
              style={{
                transform: `${isCurrent ? "scale(1) rotate(0deg)" : `scale(${scale}) rotate(${rotate}deg)`} translateY(${translateY}px)`,
                opacity: opacity,
                zIndex: zIndex,
                transformOrigin: diff > 0 ? "bottom left" : "bottom right",
                transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
              }}
              className={`relative shrink-0 snap-center cursor-pointer select-none
                ${total === 1 ? "w-full max-w-4xl mx-auto" : "w-[86%] sm:w-[72%] md:w-[65%] lg:w-[62%]"}`}
            >
              <div className={`${!isCurrent ? "pointer-events-none" : ""}`}>
                <ContinueReadingCard
                  history={history}
                  className={`w-full transition-shadow duration-300 ${
                    isCurrent ? "shadow-xl border-foreground/30 ring-1 ring-foreground/15" : "shadow-md hover:shadow-lg border-foreground/15"
                  }`}
                  onClickRemove={() => onRemoveElement?.(history)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
