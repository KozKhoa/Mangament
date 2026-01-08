import { RefObject, useEffect, useRef, useState } from "react";

export default function useNearInView(options = { threshold: 0.1, distance: 100 }): [RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [isNearView, setIsNearView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearView(true);

          const rect = entry.boundingClientRect;
          const vh = window.innerHeight;

          // kiểm tra thật sự đã vào viewport chưa
          const fullyInView = rect.top >= 0 && rect.bottom <= vh;

          if (fullyInView) {
            setIsInView(true);
            if (once) observer.disconnect();
          }
        }
      },
      {
        root: null,
        rootMargin: offset,
        threshold: 0,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [offset, once]);

  return [ref, inView];
}
