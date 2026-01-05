"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SearchBar from "@/components/search/search";
import ButtonExpandable from "@/components/buttons/expandable/btn-expandable";
import SwitchTheme from "@/components/switchs/switch-theme";

import BurgerMenuIcon from "@/public/burger-menu.svg";
import XCloseIcon from "@/public/x-close.svg";
import ButtonDropdown from "@/components/buttons/dropdown/btn-dropdown";
import ArrowUpIcon from "@/public/arrows/up-v.svg";
import genreService from "@/services/genre";
import { toast } from "sonner";
import { snakeCaseToCapitalizeWord, snakeCaseToNormal } from "@/utils/string";
import { useRouter } from "next/navigation";
import useAuth from "@/contexts/AuthContext";

import SearchStories from "../search/search-stories";
import { usePathname } from "next/navigation";

interface NavBarProps {
  duration?: number;
  className?: string;
}

function NavBar({ duration = 100, className }: NavBarProps) {
  const path = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const user = auth?.user;

  const [hidden, setHidden] = useState(false);

  const [openSidebar, setOpenSidebar] = useState(false);
  const lastScrollY = useRef(0);

  function toggleSidebar() {
    setOpenSidebar(!openSidebar);
  }

  useEffect(() => {
    function handleNavbarHidden() {
      if (window.scrollY < 100) {
        setHidden(false);
        return;
      }

      if (window.scrollY - lastScrollY.current > 10 || window.scrollY - lastScrollY.current < -30) {
        setHidden(window.scrollY > lastScrollY.current);
      }

      lastScrollY.current = window.scrollY;
    }

    window.addEventListener("scroll", handleNavbarHidden);

    return () => window.removeEventListener("scroll", handleNavbarHidden);
  }, []);

  useEffect(() => {
    setOpenSidebar(false);
  }, [path]);
  return (
    <>
      <div
        className={`flex flex-row   justify-between text-center   text-foreground 
          items-center px-2.5 py-1 h-fit bg-background z-20 transition-transform duration-300
          rounded-b-md border-b-3 border-x-2 shadow-[5px_8px_4px_rgba(0,0,0,0.3)]
          ${hidden ? "-translate-y-full" : ""} 
          ${className}
       `}
      >
        <div className={`flex flex-row justify-center items-center gap-5`}>
          <Link href={"/"}>
            <p className={`text-2xl  font-holtwood`}>Mangament</p>
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex flex-row justify-center items-center gap-5">
            <ButtonDropdown className="h-full" label="Random" onClick={() => router.push("/story/random")} />
            <ButtonDropdown className="h-full" label="Lịch phát hành" />
            <ButtonDropdown className="h-full" label="Xếp hạng" onClick={() => router.push("/ranking")} />
          </div>
        </div>

        {/* Desktop */}
        <div className=" hidden lg:flex justify-center items-center gap-2.5">
          {!openSidebar && <SwitchTheme />}

          {/* Search */}
          <SearchStories className="w-[320px]"></SearchStories>

          <ButtonDropdown
            openOnLeft={false}
            icon={
              <div className="flex gap-1.5 w-[40]">
                <Image src={"/avatar.svg"} alt="Avatar" width={40} height={40} />
              </div>
            }
          >
            <ButtonExpandable label="Thông tin tài khoản" onClick={() => router.push("/me")}></ButtonExpandable>
            <ButtonExpandable label="Cài đặt"></ButtonExpandable>
            <ButtonExpandable label="Truyện yêu thích" onClick={() => router.push("/favourites")}></ButtonExpandable>
            <ButtonExpandable label="Lịch sử đọc" onClick={() => router.push("/histories")}></ButtonExpandable>
            {user ? (
              <ButtonExpandable label="Đăng xuất" onClick={() => auth?.logout()}></ButtonExpandable>
            ) : (
              <>
                <ButtonExpandable label="Đăng nhập" onClick={() => router.push("/login")}></ButtonExpandable>
                <ButtonExpandable label="Đăng ký" onClick={() => router.push("/register")}></ButtonExpandable>
              </>
            )}
          </ButtonDropdown>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <button className="cursor-pointer" onClick={toggleSidebar}>
            <BurgerMenuIcon className="w-7 h-7" />
          </button>
        </div>

        {/* Side bar for mobile */}
        <AnimatePresence>
          {openSidebar && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              // onFocus={() => setOpenSidebar(true)}
              // onBlur={() => setOpenSidebar(false)}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={`flex fixed top-0 left-0 h-screen w-screen z-40`}
            >
              {/* The blur black will cover all screen */}
              <button onClick={toggleSidebar} className="fixed top-0 left-0 h-screen w-screen bg-[#0000007a] "></button>

              {/* The side bar */}
              <div
                className="flex fixed top-5 bottom-5 right-0 flex-col gap-2.5 min-w-3/5 w-full max-w-[500px] bg-background
                px-2.5 py-4 rounded-l-lg shadow-[10px_13px_5px_rgba(0,0,0,0.3)
                border-foreground border-l-2 border-t-2 border-b-2 "
              >
                <div className="flex flex-row justify-between ">
                  <SwitchTheme />
                  <button className=" cursor-pointer" onClick={toggleSidebar}>
                    <XCloseIcon className="fill-foreground w-8 h-8" />
                  </button>
                </div>

                <SearchStories className="w-full"></SearchStories>

                {/* Content in navbar */}
                <ul className="flex flex-col gap-2.5 overflow-y-auto">
                  {user && (
                    <li>
                      <ButtonExpandable onClick={() => router.push("/me")} label="Thông tin tài khoản" />
                    </li>
                  )}
                  <li>
                    <ButtonExpandable onClick={() => router.push("/story/random")} label="Random" />
                  </li>
                  <li>
                    <ButtonExpandable onClick={() => router.push("/ranking")} label="Xếp hạng" />
                  </li>
                  <li>
                    <ButtonExpandable label="Lịch phát hành" />
                  </li>
                  <li>
                    <ButtonExpandable label="Cài đặt" />
                  </li>
                  <li>
                    <ButtonExpandable onClick={() => router.push("/favourites")} label="Truyện yêu thích" />
                  </li>
                  <li>
                    <ButtonExpandable onClick={() => router.push("/histories")} label="Lịch sử đọc" />
                  </li>
                  {user ? (
                    <ButtonExpandable onClick={() => auth.logout()} label="Đăng xuất"></ButtonExpandable>
                  ) : (
                    <>
                      <li>
                        <ButtonExpandable onClick={() => router.push("/login")} label="Đăng nhập" />
                      </li>
                      <li>
                        <ButtonExpandable onClick={() => router.push("/register")} label="Đăng ký" />
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        className={` w-12 h-12 flex justify-center items-center border rounded-sm fixed bottom-4 right-4 p-3 z-30`}
        onClick={(e) => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <ArrowUpIcon className="w-full h-full"></ArrowUpIcon>
      </button>
    </>
  );
}

export default NavBar;
