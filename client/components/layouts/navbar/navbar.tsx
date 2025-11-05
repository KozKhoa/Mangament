"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SearchBar from "@/components/search/search";
import ButtonExpandable from "@/components/buttons/btn-expandable";
import Switch from "@/components/switchs/switch";
import SwitchTheme from "@/components/switchs/switch-theme";

import BurgerMenuIcon from "@/public/burger-menu.svg";
import XCloseIcon from "@/public/x-close.svg";
import ButtonDropdown from "@/components/buttons/dropdown/btn-dropdown";

interface NavBarProps {
  duration?: number;
}

function NavBar({ duration = 100 }: NavBarProps) {
  const [openSidebar, setOpenSidebar] = useState(false);

  function toggleSidebar() {
    setOpenSidebar(!openSidebar);
  }
  return (
    <div
      className="flex flex-row font-afacad justify-between text-center text-size-default text-foreground 
       items-center mx-2.5 px-2.5 py-1 h-fit
       rounded-b-md border-b-3 border-x-2 shadow-[5px_8px_4px_rgba(0,0,0,0.3)] "
    >
      <div className="flex flex-row justify-center items-center gap-5">
        <Link href={"/users"}>
          <p className={`text-2xl sm:text-3xl md:text-4xl font-holtwood`}>
            Mangament
          </p>
        </Link>

        {/* Desktop */}
        <div className="hidden xl:flex flex-row justify-center items-center gap-5">
          <ButtonDropdown label="Random" />
          <ButtonDropdown label="Lịch phát hành" />
          <ButtonDropdown label="Xếp hạng" />
          <ButtonDropdown label="Thể loại">
            <ButtonExpandable label="Hành động"></ButtonExpandable>
            <ButtonExpandable label="Tình cảm"></ButtonExpandable>
            <ButtonExpandable label="Học đường"></ButtonExpandable>
          </ButtonDropdown>
        </div>
      </div>

      {/* Desktop */}
      <div className=" hidden xl:flex justify-center items-center gap-2.5">
        {!openSidebar && <SwitchTheme />}
        <SearchBar />
        <ButtonDropdown
          openOnLeft={false}
          icon={
            <div className="flex gap-1.5 w-[40]">
              <Image src={"/avatar.svg"} alt="Avatar" width={40} height={40} />
            </div>
          }
        >
          <ButtonExpandable label="Thông tin tài khoản"></ButtonExpandable>
          <ButtonExpandable label="Cài đặt"></ButtonExpandable>
          <ButtonExpandable label="Truyện yêu thích"></ButtonExpandable>
          <ButtonExpandable label="Lịch sử đọc"></ButtonExpandable>
          <ButtonExpandable label="Đăng nhập"></ButtonExpandable>
          <ButtonExpandable label="Đăng ký"></ButtonExpandable>
        </ButtonDropdown>
      </div>

      {/* Mobile */}
      <div className="xl:hidden">
        <button className="cursor-pointer" onClick={toggleSidebar}>
          <BurgerMenuIcon className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      </div>

      {/* Side bar for mobile */}
      <AnimatePresence>
        {openSidebar && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`flex fixed top-0 left-0 h-screen w-screen z-50`}
          >
            {/* The blur black will cover all screen */}
            <button
              onClick={toggleSidebar}
              className="fixed top-0 left-0 h-screen w-screen bg-[#0000007a] "
            ></button>

            {/* The side bar */}
            <div
              className="flex fixed top-5 bottom-5 right-0 flex-col gap-2.5 min-w-3/5  bg-background
                px-2.5 py-4 rounded-l-lg shadow-[10px_13px_5px_rgba(0,0,0,0.3)
                border-foreground border-l-2 border-t-2 border-b-2 "
            >
              <div className="flex flex-row justify-between ">
                <SwitchTheme />
                <button className=" cursor-pointer" onClick={toggleSidebar}>
                  <XCloseIcon className="fill-foreground w-8 h-8" />
                </button>
              </div>

              <SearchBar placeHolder="Tìm kiếm" />

              {/* Content in navbar */}
              <ul className="flex flex-col gap-2.5 overflow-y-auto">
                <li>
                  <ButtonExpandable label="Thông tin tài khoản" />
                </li>
                <li>
                  <ButtonExpandable label="Random" />
                </li>
                <li>
                  <ButtonExpandable label="Thể loại">
                    <button>Hành động</button>
                    <button>Tình cảm</button>
                    <button>Học đường</button>
                  </ButtonExpandable>
                </li>
                <li>
                  <ButtonExpandable label="Xếp hạng" />
                </li>
                <li>
                  <ButtonExpandable label="Lịch phát hành" />
                </li>
                <li>
                  <ButtonExpandable label="Cài đặt" />
                </li>
                <li>
                  <ButtonExpandable label="Truyện yêu thích" />
                </li>
                <li>
                  <ButtonExpandable label="Lịch sử đọc" />
                </li>
                <li>
                  <ButtonExpandable label="Đăng nhập" />
                </li>
                <li>
                  <ButtonExpandable label="Đăng ký" />
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NavBar;
