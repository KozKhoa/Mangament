import { useEffect, useRef, useState } from "react";
import NoContent from "../cards/no-content";
import useInView from "@/hooks/useInView";

import ArrowRightIcon from "@/public/arrows/right-v.svg";
import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import Loading from "../loadings/loading";

export default function InfinityScrollHorizontalList({
  onScrollToEnd,
  label,
  onClickLabel,
  children,
  className,
  numberOfElementInScreen = { basic: 2, sm: 3, md: 4, lg: 6, xl: 7 }, // This is determine number of element you would like to show on screen depend on your screen width [basic, sm, md, lg, xl]
  autoSlide = 0,
  isLoading = false,
  isNoContent = false,
}: {
  onScrollToEnd?: () => void;
  className?: string;
  label?: string;
  onClickLabel?: () => void;
  numberOfElementInScreen?: { basic: number; sm: number; md: number; lg: number; xl: number };
  autoSlide?: number;
  isLoading?: boolean;
  isNoContent?: boolean;
  children?: React.ReactNode[];
}) {
  const slideIntervalId = useRef<NodeJS.Timeout | null>(null);
  const arrowClassNameEnabled = " w-4 h-4 lg:w-5 lg:h-5 cursor-pointer";
  const arrowClassNameDisabled = " w-4 h-4 lg:w-5 lg:h-5 cursor-pointer text-gray-400 opacity-50 pointer-events-none ";

  const sliderRef = useRef<HTMLDivElement>(null);

  const [endSliderRef, endSliderInView] = useInView({ threshold: 0.5, rootMargin: "0px" });
  const [topSliderRef, topSliderInView] = useInView({ threshold: 0.5, rootMargin: "0px" });

  const [loading, setLoading] = useState(isLoading);
  const [noContent, setNoContent] = useState(isNoContent);

  function slideToNextItem() {
    const itemWidth = endSliderRef.current?.offsetWidth;
    sliderRef.current?.scrollBy({ left: itemWidth, behavior: "smooth" });
  }

  function slideToPrevItem() {
    const itemWidth = endSliderRef.current?.offsetWidth;
    sliderRef.current?.scrollBy({ left: itemWidth ? -itemWidth : 0, behavior: "smooth" });
  }

  function startAutoPlay() {
    if (slideIntervalId.current !== null || autoSlide === 0) return;

    slideIntervalId.current = setInterval(() => {
      if (endSliderInView) sliderRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      else slideToNextItem();
    }, autoSlide);
  }

  function stopAutoPlay() {
    clearInterval(Number(slideIntervalId.current));
    slideIntervalId.current = null;
  }

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    setNoContent(isNoContent);
  }, [isNoContent]);

  useEffect(() => {
    if (!children) return;
    if (children?.length <= 0) return;

    if (endSliderInView) onScrollToEnd?.();

    startAutoPlay();

    return () => {
      stopAutoPlay();
    };
  }, [endSliderRef.current, endSliderInView, autoSlide, children]);

  return (
    <div className={` flex flex-col justify-center items-center gap-5 w-full  ${className}`}>
      <div className="w-full flex flex-row justify-between items-center px-5">
        <div onClick={() => onClickLabel?.()} className="text-[1.5em] lg:text-[2em] font-bold cursor-pointer underline">
          {label}
        </div>

        <div className="flex flex-row justify-end items-center gap-8 ml-auto">
          {!topSliderInView ? (
            <ArrowLeftIcon onClick={slideToPrevItem} className={arrowClassNameEnabled}></ArrowLeftIcon>
          ) : (
            <ArrowLeftIcon className={arrowClassNameDisabled}></ArrowLeftIcon>
          )}

          <div className="text-xl font-semibold">{children?.length || 0}</div>

          {!endSliderInView ? (
            <ArrowRightIcon onClick={slideToNextItem} className={arrowClassNameEnabled}></ArrowRightIcon>
          ) : (
            <ArrowRightIcon className={arrowClassNameDisabled}></ArrowRightIcon>
          )}
        </div>
      </div>

      <div
        ref={sliderRef}
        onPointerDown={stopAutoPlay}
        onWheel={stopAutoPlay}
        onPointerLeave={startAutoPlay}
        onTouchStart={stopAutoPlay}
        onTouchMove={stopAutoPlay}
        onTouchEnd={startAutoPlay}
        style={
          {
            "--col": `${100 / numberOfElementInScreen.basic}%`,
            "--col-sm": `${100 / numberOfElementInScreen.sm}%`,
            "--col-md": `${100 / numberOfElementInScreen.md}%`,
            "--col-lg": `${100 / numberOfElementInScreen.lg}%`,
            "--col-xl": `${100 / numberOfElementInScreen.xl}%`,
          } as React.CSSProperties
        }
        className="flex w-full h-fit overflow-x-auto snap-x snap-proximity custom-scrollbar"
      >
        {loading && <Loading className="w-full h-64"></Loading>}
        {!loading && noContent && <NoContent></NoContent>}

        {children &&
          children?.length > 0 &&
          children?.map((child, i) => (
            <div
              className=" flex-none snap-start
                  w-(--col)
                  sm:w-(--col-sm)
                  md:w-(--col-md)
                  lg:w-(--col-lg)
                  xl:w-(--col-xl)
                "
              key={i}
              ref={i === 0 ? (topSliderRef as any) : (endSliderRef as any)}
            >
              {child}
            </div>
          ))}
      </div>
    </div>
  );
}
