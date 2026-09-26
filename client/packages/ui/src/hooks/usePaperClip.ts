// This hook use to create border look like pager

import { randomNumerInRange } from "@/utils/number";
import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export default function usePaperClip(options = { distance: 12, depth: 12 }): [RefObject<HTMLElement | null>, React.CSSProperties] {
  const ref = useRef<HTMLElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const generatePaperTornPolygon = useCallback(
    (width: number, height: number): React.CSSProperties => {
      const distance = options.distance;
      const depth = options.depth;
      function randomTop() {
        let x = 0;
        let y = 0;
        const path: string[] = [];
        while (x < width) {
          x += randomNumerInRange(1, distance);
          y = randomNumerInRange(1, depth);
          if (x > width) break;

          path.push(`${x}px ${y}px`);
        }
        return path.join(",");
      }

      function randomLeft() {
        let x = 0;
        let y = height;
        const path: string[] = [];

        while (y > 0) {
          x = randomNumerInRange(1, depth);
          y -= randomNumerInRange(1, distance);
          if (y < 0) break;

          path.push(`${x}px ${y}px`);
        }
        return path.join(",");
      }

      function randomBottom() {
        let x = width;
        let y = 0;
        const path: string[] = [];

        while (x > 0) {
          x -= randomNumerInRange(1, distance);
          y = height - randomNumerInRange(1, depth);
          if (x < 0) break;

          path.push(`${x}px ${y}px`);
        }
        return path.join(",");
      }

      function randomRight() {
        let x = 0;
        let y = 0;
        const path: string[] = [];

        while (y < height) {
          x = width - randomNumerInRange(1, depth);
          y += randomNumerInRange(1, distance);
          if (y > height) break;

          path.push(`${x}px ${y}px`);
        }
        return path.join(",");
      }

      const clipPath = "polygon(" + [randomRight(), randomBottom(), randomLeft(), randomTop()].join(",") + ")";

      return { clipPath: clipPath };
    },
    [options.distance, options.depth],
  );

  useLayoutEffect(() => {
    if (!ref.current) return;

    const { offsetWidth, offsetHeight } = ref.current;

    if (offsetWidth === 0 || offsetHeight === 0) return;

    setStyle(generatePaperTornPolygon(offsetWidth, offsetHeight));
  }, [generatePaperTornPolygon]);

  useEffect(() => {
    const el = ref.current!;

    const ro = new ResizeObserver(() => {
      if (!ref.current) return;

      const { offsetWidth, offsetHeight } = ref.current;

      if (offsetWidth === 0 || offsetHeight === 0) return;

      setStyle(generatePaperTornPolygon(offsetWidth, offsetHeight));
    });

    ro.observe(el);

    return () => ro.disconnect();
  }, [generatePaperTornPolygon]);

  return [ref, style];
}
