import { useEffect, useRef, useState } from "react";

export default function useInView(options = { threshold: 0.1 }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setInView(entry.isIntersecting);
      });
    }, options);

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref.current]);

  return { ref, inView };
}
