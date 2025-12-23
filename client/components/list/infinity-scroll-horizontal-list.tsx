import { useEffect } from "react";
import NoContent from "../cards/no-content";
import useInView from "@/hooks/useInView";

export default function InfinityScrollHorizontalList({
  onScrollToEnd,
  label,
  onClickLabel,
  children,
  className,
}: {
  onScrollToEnd?: () => void;
  className?: string;
  label?: string;
  onClickLabel?: () => void;
  children?: React.ReactNode[];
}) {
  const [inViewRef, isInView] = useInView();

  useEffect(() => {
    if (isInView) onScrollToEnd?.();
  }, [isInView]);

  return (
    <div className={` flex flex-col justify-center items-center gap-5 w-full ${className}`}>
      <h2 onClick={() => onClickLabel?.()} className="text-[2em] font-bold cursor-pointer border-b-2">
        {label}
      </h2>

      <div
        className="grid grid-flow-col auto-cols-[50%] md:auto-cols-[25%] lg:auto-cols-[16.6666666667%] xl:auto-cols-[14.2857142857%] 
        w-full overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory no-scrollbar"
      >
        {children && children.length > 0 ? (
          children.map((child, i) => (
            <div className="snap-start px-1 py-2" key={i}>
              {child}
            </div>
          ))
        ) : (
          <NoContent></NoContent>
        )}
        <div ref={inViewRef as any}></div>
      </div>
    </div>
  );
}
