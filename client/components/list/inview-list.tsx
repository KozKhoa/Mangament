import { useEffect, useRef, useState } from "react";

interface InViewListProps {
  children: React.ReactNode[];
  className?: string;

  threshold?: number;

  onInView?: (indexs: number[]) => void;
}

export default function InViewList({ children, onInView, className, threshold = 0.3 }: InViewListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inViewMap, setInViewMap] = useState<boolean[]>([]);
  const refs = useRef<(Element | null)[]>([]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setInViewMap((prev) => {
          const next = [...prev];

          entries.forEach((entry) => {
            const index = refs.current.indexOf(entry.target);
            if (index !== -1) {
              next[index] = entry.isIntersecting;
            }
          });

          return next;
        });
      },
      { threshold: threshold ?? 0.3 },
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const setRef = (index: number) => (el: Element | null) => {
    if (!observerRef.current) return;

    if (el) {
      refs.current[index] = el;
      observerRef.current.observe(el); // 👈 observe ngay khi mount
    }
  };

  useEffect(() => {
    onInView?.(inViewMap.map((inView, i) => (inView ? i : -1)).filter((i) => i !== -1));
  }, [inViewMap]);

  return (
    <div className={className}>
      {children && children.length > 0 && (
        <>
          {children.map((child, index) => (
            <div key={index} ref={setRef(index)}>
              {child}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
