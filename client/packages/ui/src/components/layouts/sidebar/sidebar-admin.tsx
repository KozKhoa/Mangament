"use client";

import ButtonExpandable from "@/components/buttons/expandable/btn-expandable";
import useAuth from "@/contexts/AuthContext";
import { Ref, useEffect, useState } from "react";
import useResize from "@/hooks/useResize";
import Link from "@/components/link/Link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  className?: string;
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function ArrowToggleSidebar({ className = "", toggleSidebar }: { className?: string; toggleSidebar?: () => void }) {
  return (
    <div className={`absolute transition-transform duration-200 flex justify-center w-13 h-13 ${className}`}>
      <div
        className="relative cursor-pointer aspect-square w-full h-full
                  bg-foreground [clip-path:polygon(50%_50%,0_0,100%_0)] transition-transform duration-200  
                  rotate-180
                  md:-rotate-90"
        onClick={toggleSidebar}
      >
        <div
          className="absolute bg-background-items aspect-square w-13
                  [clip-path:polygon(50%_50%,0_0,100%_0)] left-1/2 -translate-x-1/2 -translate-y-0.5 flex items-center justify-center"
        >
          <ArrowDownIcon className="w-4.5 h-4.5 text-foreground"></ArrowDownIcon>
        </div>
      </div>
    </div>
  );
}

export default function AdminSidebar({ className = "" }: AdminSidebarProps) {
  const auth = useAuth();
  const pathname = usePathname();
  const resizeRef = useResize({ resizeRight: true, minWidth: 200 });
  const [open, setOpen] = useState(true);

  // Không cho scroll màn hình khi sidebar đang mở ở mobile
  useEffect(() => {
    if (!open) return;

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
          md:sticky md:h-screen md:top-0 w-fit z-30
          ${open ? "md:w-fit" : "md:w-0"}`}
      >
        <div
          ref={resizeRef as Ref<HTMLDivElement>}
          className={`
            transition-transform duration-200 fixed 

            /* ===== Mobile ===== */
            bottom-0 left-1/2 -translate-x-1/2 w-[90vw]

            /* ===== Desktop ===== */
            md:relative md:left-0 md:top-0 md:bottom-auto md:w-[280px] md:h-full

            drop-shadow-[0px_4px_10px_rgba(0,0,0,0.1)]
            md:drop-shadow-[4px_0px_15px_rgba(0,0,0,0.1)]

            ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:-translate-x-full md:translate-y-0"}
          `}
        >
          <div
            className={`flex flex-col bg-background-items px-2.5 py-4 shadow-lg
              border-foreground/20 gap-2

              /* ===== Mobile ===== */
              w-full h-[70vh] border-x border-t rounded-t-lg 

              /* ===== Desktop ===== */
              md:h-full md:border-r md:border-t md:border-b md:rounded-r-lg md:rounded-t-none md:border-x-0
        
              ${className}`}
          >
            {/* Top Logo & App Branding */}
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-foreground/20 mb-2 pb-3">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-foreground text-background-items font-bold flex items-center justify-center text-lg shadow-sm">M</div>
                <span className="font-bold text-lg text-foreground tracking-wide">Mangament Admin</span>
              </Link>

              <div onClick={toggleSidebar} className="cursor-pointer p-1 text-foreground hover:opacity-75">
                <ArrowDownIcon className="w-5 h-5 md:rotate-90"></ArrowDownIcon>
              </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-2.5 h-fit">
                <Link href={"/dashboard"}>
                  <ButtonExpandable
                    className={
                      pathname === "/dashboard" || pathname.includes("dashboard")
                        ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items"
                        : ""
                    }
                    label="Dashboard"
                  ></ButtonExpandable>
                </Link>

                <Link href={"/user-management"}>
                  <ButtonExpandable
                    className={
                      pathname.includes("user-management") ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items" : ""
                    }
                    label="Quản lý User"
                  ></ButtonExpandable>
                </Link>

                <Link href={"/stories-management"}>
                  <ButtonExpandable
                    className={
                      pathname.includes("stories-management") ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items" : ""
                    }
                    label="Quản lý Story"
                  ></ButtonExpandable>
                </Link>

                <Link href={"/trash"}>
                  <ButtonExpandable
                    className={pathname.includes("trash") ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items" : ""}
                    label="Thùng rác"
                  ></ButtonExpandable>
                </Link>

                <div className="h-32"></div>
              </div>
            </div>
          </div>

          {/* Mobile Toggle Button */}
          <ArrowToggleSidebar
            className={`
              /* ===== Mobile ===== */
              md:hidden
              top-0 -translate-y-full left-1/2 -translate-x-1/2
              ${open ? "scale-0" : ""}
            `}
            toggleSidebar={toggleSidebar}
          ></ArrowToggleSidebar>

          {/* Desktop Toggle Button */}
          <ArrowToggleSidebar
            className={`
              /* ===== Desktop ===== */
              hidden md:flex
              md:top-0 md:right-0 md:translate-x-full
              ${open ? "scale-0" : ""}
            `}
            toggleSidebar={toggleSidebar}
          />
        </div>
      </div>
    </>
  );
}
