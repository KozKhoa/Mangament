"use client";

import ButtonExpandable from "@/components/buttons/expandable/btn-expandable";
import useAuth from "@/contexts/AuthContext";
import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import ArrowDownIcon from "@/public/arrows/down-v.svg";
import { useEffect, useRef, useState } from "react";
import useResize from "@/hooks/useResize";

interface AdminSidebarProps {
  className?: string;
}

export function ArrowToggleSidebar({ className, toggleSidebar }: { className?: string; toggleSidebar?: () => void }) {
  return (
    <div
      className={`absolute transition-transform duration-200 flex justify-center w-13 h-13        
          ${className} `}
    >
      <div
        className="relative cursor-pointer aspect-square w-full h-full
                  bg-foreground [clip-path:polygon(50%_50%,0_0,100%_0)] transition-transform duration-200  
                  rotate-180
                  md:-rotate-90"
        onClick={toggleSidebar}
      >
        <div
          className="absolute bg-background-items aspect-square w-13
                  [clip-path:polygon(50%_50%,0_0,100%_0)] left-1/2 -translate-x-1/2 -translate-y-0.5"
        >
          <ArrowDownIcon className="w-4.5 h-4.5 m-auto"></ArrowDownIcon>
        </div>
      </div>
    </div>
  );
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const auth = useAuth();

  const resizeRef = useResize({ resizeRight: true, minWidth: 200 });

  const [open, setOpen] = useState(true);

  useEffect(() => {}, [auth?.user, auth?.loading]);

  // Không cho scroll màn hình khi sidebar đang mở ở mobile
  useEffect(() => {
    if (!open) return;

    // md = 768px
    if (window.innerWidth < 768) {
      document.body.style.overflow = open ? "hidden" : "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function toggleSidebar() {
    setOpen(!open);
  }

  if (!auth?.user) return null;
  if (auth.user.role !== "admin") return null;

  return (
    <>
      <div
        className={`relative transition-transform duration-200 
          md:sticky md:h-screen md:top-0 w-fit
          ${open ? "md:w-fit" : "md:w-0"}`}
      >
        <div
          ref={resizeRef as any}
          className={`
            transition-transform duration-200 fixed z-30

            /* ===== Mobile ===== */
            bottom-0 left-1/2 -translate-x-1/2 w-[90vw]

            /* ===== Desktop ===== */
            md:relative md:left-0 md:top-16 md:bottom-auto md:w-[280px] md:h-full

            drop-shadow-[2px_-4px_4px_rgba(0,0,0,0.3)]
            md:drop-shadow-[10px_8px_4px_rgba(0,0,0,0.3)]

            ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:-translate-x-full md:translate-y-0"}
          `}
        >
          <div
            className={`flex flex-col bg-background-items px-2.5 py-4 shadow-[10px_13px_5px_rgba(0,0,0,0.3)
              border-foreground/50 

              /* ===== Mobile ===== */
              w-full h-[70vh] border-x-2 border-t-2 rounded-t-lg 

              /* ===== Desktop ===== */
              md:h-full md:border-r-2 md:border-t-2 md:border-b-2 md:rounded-r-lg md:rounded-t-none md:border-x-0
        
              ${className}`}
          >
            <div onClick={toggleSidebar} className="flex w-full justify-end px-2 cursor-pointer">
              <ArrowDownIcon className="w-5 h-5 md:rotate-90"></ArrowDownIcon>
            </div>

            <div className="overflow-y-scroll no-scrollbar">
              <div className="flex flex-col gap-2.5 h-fit ">
                <ButtonExpandable label="Dashboard"></ButtonExpandable>

                <ButtonExpandable label="Quản lý User"></ButtonExpandable>

                <ButtonExpandable label="Quản lý Story">
                  <div className="flex flex-col gap-1 w-full rounded-bl-md pt-1">
                    <ButtonExpandable label="Manga"></ButtonExpandable>
                    <ButtonExpandable className="border-b-0" label="Light Novel"></ButtonExpandable>
                  </div>
                </ButtonExpandable>

                <div className="h-32"></div>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <ArrowToggleSidebar
            className={`
              /* ===== Mobile ===== */
              md:hidden
              top-0 -translate-y-full left-1/2 -translate-x-1/2
              ${open ? "scale-0" : ""}
            `}
            toggleSidebar={toggleSidebar}
          ></ArrowToggleSidebar>

          {/* Desktop */}
          <ArrowToggleSidebar
            className={`
              /* ===== Desktop ===== */
              hidden md:flex
              md:top-0 md:right-0 md:translate-x-full
              ${open ? "scale-0" : ""}
            `}
            toggleSidebar={toggleSidebar}
          ></ArrowToggleSidebar>
        </div>
      </div>
    </>
  );
}
