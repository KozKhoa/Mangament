import { RefObject, useEffect, useRef } from "react";

const RANGE = 12;

type ResizeDirection = "right" | "bottom" | "right-bottom";

export default function useResize({
  resizeRight = false,
  resizeBottom = false,
  minHeight = 0,
  minWidth = 0,

  maxHeight = Infinity,
  maxWidth = Infinity,
}: {
  resizeRight?: boolean;
  resizeBottom?: boolean;

  minWidth?: number;
  minHeight?: number;

  maxWidth?: number;
  maxHeight?: number;
}): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null);
  const width = useRef(0);
  const height = useRef(0);
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const resizeDir = useRef<ResizeDirection | null>(null);

  useEffect(() => {
    function onTrackingMousePos(e: MouseEvent) {
      if (!ref.current) return;

      const refRect = ref.current?.getBoundingClientRect();
      const left = refRect?.left ?? 0;
      const right = refRect?.right ?? 0;
      const top = refRect?.top ?? 0;
      const bottom = refRect?.bottom ?? 0;

      const isInRightEdge = resizeRight && Math.abs(e.clientX - right) < RANGE && e.clientY > top && e.clientY < bottom;
      const isInBottomEdge = resizeBottom && Math.abs(e.clientY - bottom) < RANGE && e.clientX > left && e.clientX < right;

      if (resizeDir.current !== null) return;

      if (isInRightEdge && isInBottomEdge) ref.current.style.cursor = "nwse-resize";
      else if (isInRightEdge) ref.current.style.cursor = "ew-resize";
      else if (isInBottomEdge) ref.current.style.cursor = "ns-resize";
      else ref.current.style.cursor = "";
    }

    function onResize(e: MouseEvent) {
      if (!ref.current) return;

      const mouseDx = e.clientX - mousePos.current.x;
      const mouseDy = e.clientY - mousePos.current.y;

      switch (resizeDir.current) {
        case "right-bottom":
          ref.current.style.width = Math.min(maxWidth, Math.max(minWidth, width.current + mouseDx)) + "px";
          ref.current.style.height = Math.min(maxHeight, Math.max(minHeight, height.current + mouseDy)) + "px";
          break;
        case "right":
          ref.current.style.width = Math.min(maxWidth, Math.max(minWidth, width.current + mouseDx)) + "px";
          break;
        case "bottom":
          ref.current.style.height = Math.min(maxHeight, Math.max(minHeight, height.current + mouseDy)) + "px";
          break;
      }
    }

    function onMouseDown(e: MouseEvent) {
      if (!ref.current) return;

      const refRect = ref.current?.getBoundingClientRect();
      const left = refRect?.left ?? 0;
      const right = refRect?.right ?? 0;
      const top = refRect?.top ?? 0;
      const bottom = refRect?.bottom ?? 0;

      mousePos.current = { x: e.clientX, y: e.clientY };

      width.current = refRect?.width ?? 0;
      height.current = refRect?.height ?? 0;

      const isInRightEdge = Math.abs(e.clientX - right) < RANGE && e.clientY > top && e.clientY < bottom;
      const isInBottomEdge = Math.abs(e.clientX - bottom) < RANGE && e.clientX > left && e.clientX < right;

      if (resizeDir.current === null) {
        if (resizeRight && resizeBottom && isInRightEdge && isInBottomEdge) resizeDir.current = "right-bottom";
        else if (resizeRight && isInRightEdge) resizeDir.current = "right";
        else if (resizeBottom && isInBottomEdge) resizeDir.current = "bottom";
        else return;
      }

      window.addEventListener("pointermove", onResize);
    }

    function onMouseUp() {
      resizeDir.current = null;

      window.removeEventListener("pointermove", onResize);
    }

    window.addEventListener("pointermove", onTrackingMousePos);
    window.addEventListener("pointerup", onMouseUp);
    window.addEventListener("pointerdown", onMouseDown);

    return () => {
      window.removeEventListener("pointermove", onTrackingMousePos);
      window.removeEventListener("pointerup", onMouseUp);
      window.removeEventListener("pointerdown", onMouseDown);
    };
  }, []);

  return ref;
}
