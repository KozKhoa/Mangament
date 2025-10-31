"use client";

import { Holtwood_One_SC } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Switch from "@/components/buttons/switch";

const holtwood = Holtwood_One_SC({
  variable: "--font-holtwood",
  subsets: ["latin"],
  weight: "400",
});

function NavBar() {
  const [openSidebar, setOpenSidebar] = useState(false);

  function toggleSidebar() {
    setOpenSidebar(!openSidebar);
  }
  return (
    <div
      className="flex flex-row justify-between text-center items-center mx-2.5 px-2.5 py-1 h-fit
       rounded-b-md border-b-3 border-x-2 shadow-[5px_8px_4px_rgba(0,0,0,0.3)]"
    >
      <Link href={"/users"}>
        <p className={`${holtwood.className} text-3xl md:text-4xl`}>
          Mangament
        </p>
      </Link>

      {/* Mobile */}
      <div className="lg:hidden">
        <button onClick={() => toggleSidebar}>
          <Image
            src={"/burger-menu.svg"}
            width={40}
            height={40}
            alt="Menu Button"
          ></Image>
          <Switch></Switch>
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex">
        <p>Desktop</p>
      </div>

      {/* Side bar for mobile */}
      {openSidebar && (
        <div
          className="fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white dark:bg-neutral-900
          shadow-xl z-50 transform transition-transform duration-300"
        >
          <head></head>
          <div></div>
          <ul></ul>
        </div>
      )}
    </div>
  );
}

export default NavBar;
