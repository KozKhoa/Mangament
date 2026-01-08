import { CSSProperties, MouseEventHandler, useCallback, useEffect, useRef, useState } from "react";

export default function CategoryCard({
  imageSource,
  label,
  onClick,
  className,
  labelClassName,
  style,
}: {
  imageSource: string;
  label?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
  labelClassName?: string;
  style?: CSSProperties;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState(16);

  const updateFontSize = useCallback(() => {
    const width = parentRef.current?.offsetWidth;
    if (!width) return;

    setFontSize(width * 0.07);
  }, [parentRef.current?.offsetWidth]);

  useEffect(() => {
    updateFontSize();

    window.addEventListener("resize", updateFontSize);

    return () => window.addEventListener("resize", updateFontSize);
  }, []);

  return (
    <div
      ref={parentRef}
      onClick={onClick}
      style={style}
      className={`overflow-hidden rounded-lg w-fit relative transition-all duration-200 cursor-pointer 
        shadow-md
        ${className}`}
    >
      <img src={imageSource} className="max-w-[500px] w-full aspect-3/2 object-cover"></img>
      <div
        className="absolute top-3/5 left-1/2 -translate-x-1/2 
           w-full hover:scale-120 hover:z-10 duration-200"
      >
        <p
          style={{ fontSize: `clamp(16px, ${(parentRef.current?.offsetWidth || 300) * 0.07}px, 30px)` }}
          className={` font-bold font-aclonica bg-background-items px-[1.5em] py-[0.5em] w-fit m-auto rounded-full
             [clip-path:polygon(10%_0%,90%_0%,100%_100%,0%_100%)] shadow-md text-center 
             ${labelClassName}
             `}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
