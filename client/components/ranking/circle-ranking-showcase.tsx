"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import ArrowRightIcon from "@/public/arrows/right-v.svg";

import Story from "@/types/story";
import { routes } from "@/lib/routes";
import { beautifulView } from "@/utils/beautiful";
import { snakeCaseToCapitalizeWord, capitalizeFirstChar } from "@/utils/string";
import DisplayStar from "@/components/displays/ratings/display-star";
import StoryStatusTag from "@/components/tags/story-status-tag";
import GenreTag from "@/components/tags/genre-tag";
import Loading from "@/components/loadings/loading";
import Link from "@/components/link/Link";

interface CircleRankingShowcaseProps {
  label?: string;
  subLabel?: string;
  stories: Story[];
  isLoading?: boolean;
  className?: string;
  autoPlay?: boolean;
  intervalMs?: number;
}

function getCoverUrl(story?: Story): string {
  if (!story?.cover_art?.path) return "/blur-image.png";
  if (story.cover_art.path.startsWith("http")) return story.cover_art.path;
  return `${process.env.NEXT_PUBLIC_CDN_URL || ""}${story.cover_art.path}`;
}

function getRankTheme(rank: number) {
  // Nhóm 1: Top 1 (Vàng ánh kim)
  if (rank === 1) {
    return {
      badgeClass: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black shadow-amber-500/40",
      ringClass: "ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]",
      textClass: "text-yellow-400 drop-shadow-[0_2px_10px_rgba(250,204,21,0.7)]",
      borderClass: "border-yellow-400/40",
      sectorActiveFill: "rgba(234, 179, 8, 0.18)",
      sectorActiveStroke: "rgba(234, 179, 8, 0.7)",
      icon: "👑",
      title: "TOP 1 XEM NHIỀU NHẤT",
      glowColor: "rgba(218, 180, 78, 0.25)",
    };
  }

  // Nhóm 2: Top 2 (Bạc)
  if (rank === 2) {
    return {
      badgeClass: "bg-gradient-to-r from-slate-200 via-gray-300 to-slate-400 text-black shadow-slate-400/40",
      ringClass: "ring-2 ring-slate-300 shadow-[0_0_18px_rgba(203,213,225,0.6)]",
      textClass: "text-slate-300 drop-shadow-[0_2px_8px_rgba(203,213,225,0.7)]",
      borderClass: "border-slate-300/40",
      sectorActiveFill: "rgba(148, 163, 184, 0.18)",
      sectorActiveStroke: "rgba(203, 213, 225, 0.7)",
      icon: "🥈",
      title: "TOP 2 XEM NHIỀU NHẤT",
      glowColor: "rgba(148, 163, 184, 0.25)",
    };
  }

  // Nhóm 3: Top 3 (Đồng)
  if (rank === 3) {
    return {
      badgeClass: "bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-white shadow-orange-500/40",
      ringClass: "ring-2 ring-amber-600 shadow-[0_0_18px_rgba(217,119,6,0.6)]",
      textClass: "text-amber-500 drop-shadow-[0_2px_8px_rgba(217,119,6,0.7)]",
      borderClass: "border-amber-600/40",
      sectorActiveFill: "rgba(217, 119, 6, 0.18)",
      sectorActiveStroke: "rgba(217, 119, 6, 0.7)",
      icon: "🥉",
      title: "TOP 3 XEM NHIỀU NHẤT",
      glowColor: "rgba(217, 119, 6, 0.25)",
    };
  }

  // Nhóm 4: Các top còn lại (Top 4 - Top 8)
  return {
    badgeClass: "bg-foreground/15 text-foreground border border-foreground/20 backdrop-blur-md",
    ringClass: "ring-2 ring-foreground/60 shadow-[0_0_15px_rgba(var(--foreground-rgb),0.3)]",
    textClass: "text-foreground/60 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]",
    borderClass: "border-foreground/20",
    sectorActiveFill: "rgba(120, 120, 120, 0.12)",
    sectorActiveStroke: "rgba(120, 120, 120, 0.5)",
    icon: "🔥",
    title: `TOP ${rank} XEM NHIỀU NHẤT`,
    glowColor: "rgba(120, 120, 120, 0.12)",
  };
}

/**
 * Sinh chuỗi SVG path cho một sector (lát cắt hình quạt donut)
 * Góc 0° là ở vị trí 12 giờ (trên cùng), tăng dần theo chiều kim đồng hồ
 */
function getSectorPath(cx: number, cy: number, rIn: number, rOut: number, startDeg: number, endDeg: number): string {
  const rad = Math.PI / 180;
  const x1Out = cx + rOut * Math.sin(startDeg * rad);
  const y1Out = cy - rOut * Math.cos(startDeg * rad);
  const x2Out = cx + rOut * Math.sin(endDeg * rad);
  const y2Out = cy - rOut * Math.cos(endDeg * rad);

  const x1In = cx + rIn * Math.sin(startDeg * rad);
  const y1In = cy - rIn * Math.cos(startDeg * rad);
  const x2In = cx + rIn * Math.sin(endDeg * rad);
  const y2In = cy - rIn * Math.cos(endDeg * rad);

  const arcSweep = endDeg - startDeg <= 180 ? "0" : "1";

  return `M ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 ${arcSweep} 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A ${rIn} ${rIn} 0 ${arcSweep} 0 ${x1In} ${y1In} Z`;
}

export default function CircleRankingShowcase({
  label = "Top 8 Truyện Xem Nhiều Nhất",
  subLabel = "Biểu đồ tròn 8 phần tương ứng với 8 tác phẩm có lượt đọc nhiều nhất",
  stories = [],
  isLoading = false,
  className = "",
  autoPlay = true,
  intervalMs = 4000,
}: CircleRankingShowcaseProps) {
  const router = useRouter();

  // Bảng xếp hạng lấy đúng 8 truyện tương ứng với 8 phần của biểu đồ tròn
  const rankingStories = stories.slice(0, 8);
  const totalItems = rankingStories.length;
  const SECTOR_COUNT = 8;
  const SLICE_ANGLE = 360 / SECTOR_COUNT; // 45 độ mỗi phần

  const [activeIndex, setActiveIndex] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Kích thước toạ độ SVG Donut Chart
  const svgSize = 500;
  const cx = 250;
  const cy = 250;
  const rOut = 222;
  const rIn = 72;
  const rMid = (rIn + rOut) / 2; // ~147px

  // Xoay tới phần tử mục tiêu theo cung ngắn nhất để lát cắt đó nằm ở vị trí 12h (thanh kim trên cùng)
  const rotateTo = useCallback(
    (targetIndex: number) => {
      if (totalItems <= 1) return;
      let diff = targetIndex - activeIndex;
      while (diff > totalItems / 2) diff -= totalItems;
      while (diff < -totalItems / 2) diff += totalItems;

      setRotationAngle((prev) => prev - diff * SLICE_ANGLE);
      setActiveIndex((targetIndex + totalItems) % totalItems);
    },
    [activeIndex, SLICE_ANGLE, totalItems],
  );

  const handleNext = useCallback(() => {
    if (totalItems <= 1) return;
    setRotationAngle((prev) => prev - SLICE_ANGLE);
    setActiveIndex((prev) => (prev + 1) % totalItems);
  }, [SLICE_ANGLE, totalItems]);

  const handlePrev = useCallback(() => {
    if (totalItems <= 1) return;
    setRotationAngle((prev) => prev + SLICE_ANGLE);
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [SLICE_ANGLE, totalItems]);

  // Tự động xoay sau mỗi chu kỳ intervalMs, tạm dừng khi người dùng hover chuột vào showcase
  useEffect(() => {
    if (!autoPlay || totalItems <= 1 || isLoading || isHovered) return;

    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      handleNext();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, totalItems, isLoading, isHovered, intervalMs, handleNext]);

  if (isLoading || rankingStories.length === 0) {
    return (
      <div className={`flex flex-col gap-4 w-full ${className}`}>
        <div className="flex items-center justify-between border-b-2 border-foreground/30 pb-2 px-2">
          <h2 className="text-2xl sm:text-3xl font-bold">{label}</h2>
        </div>
        <div className="h-[480px] flex justify-center items-center bg-background-items/40 rounded-2xl border border-foreground/10">
          <Loading className="w-full h-32" />
        </div>
      </div>
    );
  }

  const activeStory = rankingStories[activeIndex] || rankingStories[0];
  const activeRank = activeIndex + 1;
  const activeTheme = getRankTheme(activeRank);

  return (
    <div className={`flex flex-col gap-5 w-full ${className}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Tiêu đề mục */}
      <div className="flex flex-wrap items-end justify-between border-b-2 border-foreground pb-2 px-2 gap-3">
        <div>
          <h2
            onClick={() => router.push(routes.ranking())}
            className="text-2xl sm:text-3xl font-extrabold cursor-pointer hover:underline flex items-center gap-2.5"
          >
            <span className="text-amber-500">🏆</span> {label}
          </h2>
          {subLabel && <p className="text-sm text-foreground/60 mt-0.5">{subLabel}</p>}
        </div>

        {/* Nút điều hướng tuần tự */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            aria-label="Truyện trước"
            className="w-5 h-5 rounded-lg flex items-center justify-center font-bold text-foreground transition-all cursor-pointer"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-md font-bold text-foreground/70 min-w-10 text-center">
            {activeRank} / {totalItems}
          </span>
          <button
            onClick={handleNext}
            aria-label="Truyện tiếp theo"
            className="w-5 h-5 rounded-lg flex items-center justify-center font-bold text-foreground transition-all cursor-pointer"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Khung nội dung chính: Bên trái là biểu đồ tròn 8 phần có thanh kim ở trên cùng, Bên phải là Story Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full min-h-[500px]">
        {/* ======================================================== */}
        {/* CỘT TRÁI: BIỂU ĐỒ TRÒN 8 PHẦN & THANH KIM Ở TRÊN CÙNG    */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 relative w-full flex flex-col items-center justify-center select-none py-8 px-4 overflow-visible">
          {/* ======================================================== */}
          {/* THANH KIM NẰM Ở TRÊN CÙNG (12h) DÙNG ĐỂ XÁC ĐỊNH TRUYỆN  */}
          {/* ======================================================== */}
          <div className="relative z-40 flex flex-col items-center pointer-events-none -mb-3 sm:-mb-4">
            {/* Nhãn tag hiển thị trên đầu kim */}
            <div className="px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-foreground text-background shadow-lg border border-background/20 flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
              <span>ĐANG CHỌN</span>
            </div>

            {/* Cây kim chỉ hướng thẳng xuống lát cắt 12h */}
            <svg
              width="32"
              height="40"
              viewBox="0 0 32 40"
              fill="none"
              className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] animate-bounce"
              style={{ animationDuration: "2s" }}
            >
              {/* Thân kim hình thoi / mũi nhọn */}
              <path
                d="M16 40L6 14C4 9 7 3 13 3H19C25 3 28 9 26 14L16 40Z"
                fill="url(#needleGrad)"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-foreground"
              />
              {/* Vòng đai chốt kim */}
              <circle cx="16" cy="11" r="5" fill="#ffffff" />
              <circle cx="16" cy="11" r="2.5" fill="#ef4444" />

              <defs>
                <linearGradient id="needleGrad" x1="16" y1="3" x2="16" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ef4444" />
                  <stop offset="0.6" stopColor="#dc2626" />
                  <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* ======================================================== */}
          {/* KHUNG BIỂU ĐỒ TRÒN QUAY TỰ DO (WHEEL CONTAINER)         */}
          {/* ======================================================== */}
          <div className="relative w-[340px] h-[340px] sm:w-[410px] sm:h-[410px] md:w-[460px] md:h-[460px] flex items-center justify-center overflow-visible">
            {/* Lớp quay motion: Xoay toàn bộ 8 lát cắt và ảnh bìa cùng lúc */}
            <motion.div
              className="relative w-full h-full rounded-full overflow-visible"
              animate={{ rotate: rotationAngle }}
              transition={{ type: "spring", stiffness: 65, damping: 15 }}
              style={{ transformOrigin: "center center" }}
            >
              {/* 1. LỚP SVG BIỂU ĐỒ TRÒN: 8 LÁT CẮT HÌNH QUẠT */}
              <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="absolute inset-0 w-full h-full pointer-events-auto overflow-visible">
                {/* Vành tròn trang trí viền ngoài */}
                <circle cx={cx} cy={cy} r={rOut + 3} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-foreground/20" />

                {/* 8 lát cắt của biểu đồ tròn */}
                {Array.from({ length: SECTOR_COUNT }).map((_, i) => {
                  const startDeg = i * SLICE_ANGLE - SLICE_ANGLE / 2;
                  const endDeg = i * SLICE_ANGLE + SLICE_ANGLE / 2;
                  const pathData = getSectorPath(cx, cy, rIn, rOut, startDeg, endDeg);
                  const isActive = i === activeIndex;
                  const theme = getRankTheme(i + 1);

                  return (
                    <g key={i} onClick={() => rotateTo(i)} className="cursor-pointer group">
                      <path
                        d={pathData}
                        fill={isActive ? theme.sectorActiveFill : "currentColor"}
                        stroke={isActive ? theme.sectorActiveStroke : "currentColor"}
                        strokeWidth={isActive ? "2.5" : "1.5"}
                        className={`transition-all duration-300 ${
                          isActive ? "" : "text-foreground/[0.04] group-hover:text-foreground/[0.12] stroke-foreground/20 group-hover:stroke-foreground/40"
                        }`}
                      />

                      {/* Vạch kẻ chia ranh giới các phần */}
                      <line
                        x1={cx + rIn * Math.sin(startDeg * (Math.PI / 180))}
                        y1={cy - rIn * Math.cos(startDeg * (Math.PI / 180))}
                        x2={cx + rOut * Math.sin(startDeg * (Math.PI / 180))}
                        y2={cy - rOut * Math.cos(startDeg * (Math.PI / 180))}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-foreground/25 pointer-events-none"
                      />
                    </g>
                  );
                })}

                {/* Viền tròn bao quanh phần lõi rỗng */}
                <circle cx={cx} cy={cy} r={rIn} fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/30" />
              </svg>

              {/* 2. CÁC COVER_ART VÀ CON SỐ THỨ TỰ RANKING LỚN TRÀN RA NGOÀI VÒNG TRÒN */}
              {rankingStories.map((story, i) => {
                const rank = i + 1;
                const isActive = i === activeIndex;
                const theme = getRankTheme(rank);

                // Tính toạ độ tâm của ảnh trên lát cắt thứ i
                const angleDeg = i * SLICE_ANGLE; // 0, 45, 90, 135...
                const angleRad = angleDeg * (Math.PI / 180);
                const posX = 50 + ((rMid * Math.sin(angleRad)) / svgSize) * 100;
                const posY = 50 - ((rMid * Math.cos(angleRad)) / svgSize) * 100;

                return (
                  <div
                    key={story.id}
                    className="absolute pointer-events-auto cursor-pointer overflow-visible"
                    style={{
                      left: `${posX}%`,
                      top: `${posY}%`,
                      transformOrigin: "center center",
                      // Xoay ảnh theo góc của lát cắt: Chân ảnh hướng vào tâm, đầu ảnh hướng ra viền ngoài
                      transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
                      zIndex: isActive ? 30 : 10,
                    }}
                    onClick={() => rotateTo(i)}
                  >
                    {/* CON SỐ THỨ TỰ RANKING NHỎ GỌN TRÀN NHẸ RA NGOÀI VÒNG TRÒN */}
                    <div
                      className={`absolute -top-4 sm:-top-5 md:-top-6 left-1/2 -translate-x-1/2 font-aclonica text-xl sm:text-2xl md:text-3xl font-black select-none pointer-events-none transition-all duration-300 z-30 ${
                        theme.textClass
                      } ${
                        isActive ? "scale-115 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" : "opacity-80 hover:opacity-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
                      }`}
                      style={{
                        WebkitTextStroke: "0.5px rgba(0,0,0,0.3)",
                      }}
                    >
                      {rank}
                    </div>

                    {/* Khung thẻ ảnh bìa đặt contain trong lát cắt */}
                    <div
                      className={`relative w-[58px] h-[82px] sm:w-[68px] sm:h-[98px] md:w-[74px] md:h-[106px] rounded-lg overflow-hidden transition-all duration-300 ${
                        isActive
                          ? `${theme.ringClass} scale-110 shadow-2xl`
                          : "opacity-75 hover:opacity-100 hover:scale-105 shadow-md border border-foreground/20"
                      }`}
                    >
                      <Image src={getCoverUrl(story)} alt={story.title} fill sizes="(max-width: 640px) 70px, 90px" className="object-cover" priority={i < 3} />

                      {/* Lớp phủ gradient làm nổi bật */}
                      {isActive && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* ======================================================== */}
            {/* LÕI RỖNG MẤT TÂM Ở GIỮA (HUBLESS CENTER DISPLAY)         */}
            {/* ======================================================== */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-background-items/90 backdrop-blur-md border-2 border-foreground/25 shadow-xl flex flex-col items-center justify-center z-20 pointer-events-none"
              style={{
                boxShadow: `0 0 25px ${activeTheme.glowColor}`,
              }}
            >
              <span className="text-xl sm:text-2xl">{activeTheme.icon}</span>
              <span className={`font-aclonica text-xl sm:text-2xl font-black ${activeTheme.textClass}`}>#{activeRank}</span>
              <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest mt-0.5">XẾP HẠNG</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CỘT PHẢI: STORY CARD CỦA BỘ TRUYỆN ĐANG ĐƯỢC THANH KIM TRỎ VÀO */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStory.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full rounded-lg p-5 sm:p-7 overflow-hidden bg-background-items"
            >
              {/* Ảnh nền mờ nghệ thuật lấy từ cover của truyện đang chọn */}
              {/* <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 dark:opacity-20 z-0">
                <Image src={getCoverUrl(activeStory)} alt="" fill className="object-cover blur-3xl scale-125" />
              </div> */}

              {/* Quầng sáng góc */}
              {/* <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none blur-3xl" style={{ backgroundColor: activeTheme.glowColor }} /> */}

              <div className="relative z-10 flex flex-col gap-4 sm:gap-5 w-full ">
                {/* 1. Thanh tiêu đề thứ hạng & thẻ trạng thái */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Huy hiệu thứ hạng theo kim chỉ */}
                    <div
                      className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${activeTheme.badgeClass}`}
                    >
                      <span>{activeTheme.icon}</span>
                      <span>{activeTheme.title}</span>
                    </div>

                    {/* Thẻ loại truyện [MANGA / LIGHT NOVEL] */}
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-foreground/10 text-foreground/80 border border-foreground/10">
                      {snakeCaseToCapitalizeWord(activeStory.type || "manga")}
                    </span>

                    {/* Trạng thái phát hành */}
                    {activeStory.status && <StoryStatusTag status={activeStory.status}>{capitalizeFirstChar(activeStory.status)}</StoryStatusTag>}
                  </div>

                  {/* Cờ quốc gia */}
                  {activeStory.nation && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground/70 font-semibold">
                      {activeStory.nation.flag_image?.path ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_CDN_URL || ""}${activeStory.nation.flag_image.path}`}
                          alt={activeStory.nation.name}
                          width={20}
                          height={14}
                          className="object-contain rounded-xs"
                        />
                      ) : (
                        <span>{activeStory.nation.flag_icon}</span>
                      )}
                      <span>{activeStory.nation.name}</span>
                    </div>
                  )}
                </div>

                {/* 2. Phần thân thẻ: Bìa phóng to + Thông tin chi tiết */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-start">
                  {/* Bìa truyện lớn có hiệu ứng hover */}
                  <div className="sm:col-span-4 flex justify-center sm:justify-start">
                    <div
                      onClick={() => router.push(routes.story({ storyType: activeStory.type, storyId: activeStory.id }))}
                      className="group relative w-36 h-52 sm:w-full sm:h-64 rounded-xl overflow-hidden shadow-xl border border-white/20 cursor-pointer"
                    >
                      <Image
                        src={getCoverUrl(activeStory)}
                        alt={activeStory.title}
                        fill
                        sizes="(max-width: 640px) 150px, 200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-background/90 text-foreground text-xs font-bold shadow-lg">
                          Xem truyện
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin mô tả, tác giả, số liệu */}
                  <div className="sm:col-span-8 flex flex-col gap-2.5">
                    {/* Tên truyện */}
                    <h3
                      onClick={() => router.push(routes.story({ storyType: activeStory.type, storyId: activeStory.id }))}
                      className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground hover:text-amber-500 transition-colors cursor-pointer line-clamp-2 leading-tight"
                    >
                      {activeStory.title}
                    </h3>

                    {/* Tên phụ */}
                    {activeStory.other_titles && activeStory.other_titles.length > 0 && (
                      <p className="text-xs sm:text-sm italic text-foreground/60 line-clamp-1">Tên khác: {activeStory.other_titles.join(" • ")}</p>
                    )}

                    {/* Tác giả */}
                    {activeStory.author && activeStory.author.length > 0 && (
                      <p className="text-xs sm:text-sm text-foreground/80">
                        <span className="font-semibold text-foreground/60">Tác giả: </span>
                        {activeStory.author.map((a) => a.name).join(", ")}
                      </p>
                    )}

                    {/* Hộp số liệu đo lường: Lượt xem, Đánh giá, Số chương */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-foreground/5 border border-foreground/10 text-center my-1">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[11px] text-foreground/60">Lượt xem</span>
                        <span className="font-black text-sm sm:text-base text-foreground">{beautifulView(activeStory.view || 0)}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-x border-foreground/10 px-1">
                        <span className="text-[11px] text-foreground/60">Đánh giá</span>
                        <div className="flex items-center gap-1">
                          <DisplayStar rating={activeStory.star || 0} width="0.8em" height="0.8em" />
                          <span className="font-black text-sm sm:text-base text-amber-500">{(activeStory.star || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[11px] text-foreground/60">Số chương</span>
                        <span className="font-black text-sm sm:text-base text-foreground">{activeStory.number_of_children || 0}</span>
                      </div>
                    </div>

                    {/* Thể loại (Genre tags) */}
                    {activeStory.genres && activeStory.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs font-semibold text-foreground/60 mr-1">Thể loại:</span>
                        {activeStory.genres.slice(0, 5).map((genreName) => (
                          <GenreTag key={genreName} tagName={genreName} className="text-xs" />
                        ))}
                      </div>
                    )}

                    {/* Tóm tắt ngắn gọn */}
                    {activeStory.summary && (
                      <div className="relative text-xs sm:text-sm text-foreground/75 leading-relaxed bg-foreground/[0.03] p-2.5 rounded-lg border-l-2 border-foreground/30 line-clamp-3">
                        {activeStory.summary}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Nút hành động & thanh 8 nút điều hướng */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-foreground/10">
                  {/* Nút Đọc ngay & Chi tiết */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => router.push(routes.story({ storyType: activeStory.type, storyId: activeStory.id }))}
                      className="px-5 py-2.5 rounded-xl font-extrabold text-sm bg-accept-button text-white hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span>📖</span> Đọc ngay
                    </button>

                    <Link
                      href={routes.story({ storyType: activeStory.type, storyId: activeStory.id })}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm bg-foreground/10 hover:bg-foreground/20 text-foreground transition-all flex items-center gap-1.5"
                    >
                      Chi tiết
                    </Link>
                  </div>

                  {/* Thanh 8 Dots đại diện cho 8 thứ hạng */}
                  <div className="flex items-center gap-1.5">
                    {rankingStories.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => rotateTo(i)}
                        title={`Chuyển tới Top ${i + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          i === activeIndex ? "w-6 bg-foreground shadow-sm" : "w-2 bg-foreground/30 hover:bg-foreground/60"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
