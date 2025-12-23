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

      <div className="flex flex-row overflow-x-auto no-scrollbar w-full p-2">
        {children && children.length > 0 ? (
          <>
            <div className="flex flex-row justify-center items-start gap-2 w-fit">{children}</div>
          </>
        ) : (
          <NoContent></NoContent>
        )}
        <div ref={inViewRef as any}></div>
      </div>
    </div>
  );
}
