import { useEffect, useRef, useState } from "react";

export default function SlidingUnderlineSelection({
  className,
  itemsClassName,
  underlineClassName,
  defaultSelection,
  onSelected,
  labels,
}: {
  className?: string;
  itemsClassName?: string;
  underlineClassName?: string;
  defaultSelection?: number;
  onSelected?: (index: number) => void;
  labels: string[];
}) {
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  const underlineRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState(defaultSelection ?? null);

  function handleClick(index: number) {
    if (index < 0 || index >= labels.length) return;
    setSelected(index);
    onSelected?.(index);
  }

  useEffect(() => {
    if (selected === null) return;
    if (selected < 0 || selected > labels.length - 1) return;

    if (underlineRef.current) {
      underlineRef.current.style.width = itemsRef.current?.[selected]?.offsetWidth + "px";
      underlineRef.current.style.transform = `translateX(${itemsRef.current?.[selected]?.offsetLeft}px)`;
    }
  }, [selected]);

  return (
    <div className={`relative ${className} `}>
      {/* Selection items */}
      <div ref={parentRef} className={`flex flex-row gap-4 justify-center`}>
        {labels?.map((item, i) => (
          <div
            key={i}
            ref={(ref) => {
              if (ref) itemsRef.current[i] = ref;
            }}
            onClick={() => handleClick(i)}
            className={`text-xl hover:text-foreground hover:-translate-y-1 hover:scale-110
              px-3 py-1 cursor-pointer transition-all duration-200 font-semibold
              ${selected === i ? "text-foreground" : "text-foreground/45 "} ${itemsClassName}`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Underline */}
      <div
        ref={underlineRef}
        className={`absolute bottom-0 h-0.5 rounded-full bg-foreground 
          transition-all duration-200 ${underlineClassName} `}
      ></div>
    </div>
  );
}
