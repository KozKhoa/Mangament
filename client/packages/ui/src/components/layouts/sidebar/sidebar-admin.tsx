"use client";

import ButtonExpandable from "@/components/buttons/expandable/btn-expandable";
import useAuth from "@/contexts/AuthContext";
import { Ref, useEffect, useState } from "react";
import useResize from "@/hooks/useResize";
import Link from "@/components/link/Link";
import { usePathname } from "next/navigation";

import Image from "next/image";
import { imageUrlResole } from "@/utils/imageUrlResole";
import LogoutIcon from "@/public/auth/logout.svg";
import ProfileIcon from "@/public/people/people.svg";
import PasswordIcon from "@/public/change-password.svg";
import DashboardIcon from "@/public/dashboard.svg";
import StoryIcon from "@/public/book.svg";
import TrashIcon from "@/public/delete.svg";
import { motion, AnimatePresence } from "framer-motion";

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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3003";
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

  const getAuthUrl = (path: string) => `${authUrl}${path}`;

  const handleLogout = async () => {
    await auth?.logout();
    window.location.href = `${authUrl}/login?redirect=${encodeURIComponent(adminUrl)}`;
  };

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
          md:sticky md:h-screen md:top-0 w-fit
          ${open ? "md:w-fit" : "md:w-0"}`}
      >
        <div
          ref={resizeRef as Ref<HTMLDivElement>}
          className={`
            transition-transform duration-200 fixed 

            /* ===== Mobile ===== */
            bottom-0 left-1/2 -translate-x-1/2 w-[90vw] z-50

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

            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <div className="flex flex-col gap-2.5 h-fit pb-2">
                <Link href={"/dashboard"}>
                  <ButtonExpandable
                    className={`
                      rounded-b-none
                      ${
                        pathname === "/dashboard" || pathname.includes("dashboard")
                          ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items"
                          : ""
                      }`}
                    icon={<DashboardIcon className="w-5 h-5 shrink-0" />}
                    label="Dashboard"
                  />
                </Link>

                <Link href={"/user"}>
                  <ButtonExpandable
                    className={`
                      rounded-b-none
                      ${pathname.includes("user") ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items" : ""}`}
                    icon={<ProfileIcon className="w-5 h-5 shrink-0" />}
                    label="Quản lý User"
                  />
                </Link>

                <Link href={"/story"}>
                  <ButtonExpandable
                    className={`rounded-b-none 
                      ${pathname.includes("story") ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items" : ""}`}
                    icon={<StoryIcon className="w-5 h-5 shrink-0" />}
                    label="Quản lý Story"
                  />
                </Link>

                <Link href={"/trash"}>
                  <ButtonExpandable
                    className={`rounded-b-none ${pathname.includes("trash") ? "bg-foreground/95 text-background-items hover:bg-foreground/95 hover:text-background-items" : ""}`}
                    icon={<TrashIcon className="w-5 h-5 shrink-0" />}
                    label="Thùng rác"
                  />
                </Link>
              </div>
            </div>

            {/* Bottom User Account Section */}
            <div className="mt-auto pt-3 border-t border-foreground/20 flex flex-col gap-1 shrink-0">
              <div
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className={`flex items-center justify-between p-2 rounded-lg border border-foreground/15 bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer select-none ${
                  accountMenuOpen ? "border-foreground/30 bg-foreground/10" : ""
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-foreground/20 bg-background flex items-center justify-center">
                    <Image
                      src={imageUrlResole(auth.user?.avatar, { fallback: "/avatar.png" })}
                      alt="Avatar"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="font-semibold text-foreground truncate leading-tight">{auth.user?.name || "Admin"}</span>
                    <span className="text-xs text-foreground/60 truncate">Quản trị viên</span>
                  </div>
                </div>

                <div className={`p-1 transition-transform duration-200 text-foreground/60 shrink-0 ${accountMenuOpen ? "rotate-180" : ""}`}>
                  <ArrowDownIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Collapsible Account Menu */}
              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className="overflow-hidden flex flex-col gap-1 pt-1"
                  >
                    <a
                      href={getAuthUrl("/me")}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      <ProfileIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">Thông tin tài khoản</span>
                    </a>

                    <a
                      href={getAuthUrl("/change-password")}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      <PasswordIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">Đổi mật khẩu</span>
                    </a>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer w-full text-left"
                    >
                      <LogoutIcon className="w-4 h-4 shrink-0 fill-red-500 text-red-500" />
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
