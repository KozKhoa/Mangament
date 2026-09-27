"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { loadingBar, LoadingBarItem } from "./top-loading-bar.store";
import { AnimatePresence, motion } from "framer-motion";

export default function TopLoadingRoot() {
  const [stack, setStack] = useState<LoadingBarItem | null>(null);
  const [process, setProcess] = useState<number>(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Tự động đóng loading bar khi chuyển route/searchParams
  useEffect(() => {
    loadingBar.close();
  }, [pathname, searchParams]);

  useEffect(() => loadingBar.subscribe(setStack), []);

  useEffect(() => {
    if (!stack) return;

    setProcess(0);

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") loadingBar.close();
    };

    document.addEventListener("keydown", onEsc);

    const interval = setInterval(() => {
      setProcess((prev) => {
        if (prev >= 95) return prev;
        return prev + 2;
      });
    }, stack.speed || 15);

    return () => {
      document.removeEventListener("keydown", onEsc);
      clearInterval(interval);
    };
  }, [stack]);

  if (!stack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "linear" }}
        className="fixed top-0 left-0 w-full z-[9999] pointer-events-none"
      >
        <div className="w-full">
          <div
            className="rounded-r-full transition-all duration-150 ease-out"
            style={{
              width: process + "%",
              backgroundColor: stack.color ?? "#6366f1",
              height: (stack.height ?? 3) + "px",
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
