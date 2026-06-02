"use client";

import { useEffect, useState } from "react";
import { loadingBar, LoadingBarItem } from "./top-loading-bar.store";
import { AnimatePresence, motion } from "framer-motion";

export default function TopLoadingRoot() {
  const [stack, setStack] = useState<LoadingBarItem | null>(null);

  const [process, setProcess] = useState<number>(0);

  useEffect(() => loadingBar.subscribe(setStack), []);

  useEffect(() => {
    if (!stack) return;

    setProcess(0);

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") loadingBar.close();
    };

    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";

    const interval = setInterval(() => {
      setProcess((prev) => {
        if (prev >= 100) return prev;
        else return prev + 1;
      });
    }, stack.speed);

    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";

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
        className=" fixed top-0 left-0 w-[99vw] z-40"
      >
        <div className="w-full">
          <div className="rounded-full" style={{ width: process + "%", backgroundColor: stack.color ?? "#0078D4", height: (stack.height ?? 3) + "px" }}></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
