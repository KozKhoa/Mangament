"use client";

import Image from "next/image";
import Link from "@/components/link/Link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

import XCloseIcon from "@/public/x-close.svg";
import ArrowUpIcon from "@/public/arrows/up-v.svg";
import BurgerMenuIcon from "@/public/burger-menu.svg";
import ArrowDownIcon from "@/public/arrows/down-v.svg";
import LoginIcon from "@/public/auth/login.svg";
import LogoutIcon from "@/public/auth/logout.svg";
import SignUpIcon from "@/public/auth/sign-up.svg";
import HistoryIcon from "@/public/history.svg";
import FavouriteIcon from "@/public/favourite.svg";
import ProfileIcon from "@/public/people/people.svg";
import ManageIcon from "@/public/manage.svg";
import RankingIcon from "@/public/ranking.svg";
import RandomIcom from "@/public/random.svg";
import GenreIcon from "@/public/layer.svg";
import PasswordIcon from "@/public/change-password.svg";

import SwitchTheme from "@/components/switchs/switch-theme";
import SearchStories from "@/components/search/search-stories";
import ButtonDropdown from "@/components/buttons/dropdown/btn-dropdown";

import { snakeCaseToCapitalizeWord } from "@/utils/string";

import useApp from "@/contexts/AppContext";
import useAuth from "@/contexts/AuthContext";
import ButtonExpandable from "../buttons/expandable/btn-expandable";

interface NavBarProps {
  duration?: number;
  className?: string;
  autoHide?: boolean;
}

const className = {
  buttonDropdown: `flex flex-row justify-start items-center gap-2 px-5 py-1.5 text-start
    border-b border-foreground w-full hover:bg-foreground/20`,
  buttonNavBar: `flex flex-col relative justify-center items-start p-px text-foreground bg-background-items h-fit w-full`,
};

function ProfileButton() {
  return (
    <Link href={"/me"} className={className.buttonDropdown}>
      <ProfileIcon className="w-5 h-5" />
      Thông tin tài khoản
    </Link>
  );
}

function RankingButton({ isMobile = false }: { isMobile?: boolean }) {
  if (isMobile) {
    return (
      <Link href="/ranking" className={className.buttonDropdown}>
        <RankingIcon className="w-5 h-5" />
        Xếp hạng
      </Link>
    );
  } else {
    return (
      <Link href="/ranking" className={className.buttonNavBar}>
        Xếp hạng
      </Link>
    );
  }
}

function RandomStoryButton({ isMobile = false }: { isMobile?: boolean }) {
  if (isMobile) {
    return (
      <Link href="/stories/random" className={className.buttonDropdown}>
        <RandomIcom className="w-5 h-5" />
        Random
      </Link>
    );
  } else {
    return (
      <Link href="/stories/random" className={className.buttonNavBar}>
        Random
      </Link>
    );
  }
}

function FavouriteStoryButton() {
  return (
    <Link href="/favourites" className={className.buttonDropdown}>
      <FavouriteIcon className="w-5 h-5" />
      Truyện yêu thích
    </Link>
  );
}

function HistoryButton() {
  return (
    <Link href="/histories" className={className.buttonDropdown}>
      <HistoryIcon className="w-5 h-5" />
      Lịch sử đọc
    </Link>
  );
}

function WebManagementButton() {
  return (
    <Link href={"/admin/dashboard"} className={className.buttonDropdown}>
      <ManageIcon className="w-5 h-5" />
      Quản lý Web
    </Link>
  );
}

function LoginButton() {
  return (
    <Link href="/login" className={className.buttonDropdown}>
      <LoginIcon className="w-5 h-5" />
      Đăng nhập
    </Link>
  );
}

function RegisterButton() {
  return (
    <Link href="/register" className={className.buttonDropdown}>
      <SignUpIcon className="w-5 h-5" />
      Đăng ký
    </Link>
  );
}

function LogoutButton() {
  const auth = useAuth();
  return (
    <Link
      href="/"
      className={className.buttonDropdown}
      onClick={() => {
        auth?.logout();
      }}
    >
      <LogoutIcon className="w-5 h-5" />
      Đăng xuất
    </Link>
  );
}

function ChangePasswordButton() {
  return (
    <Link href="/change-password" className={className.buttonDropdown}>
      <PasswordIcon className="w-5 h-5" />
      Đổi mật khẩu
    </Link>
  );
}

function GenreButton({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter();
  const app = useApp();
  const genres = app?.genres ?? [];

  if (isMobile) {
    return (
      <ButtonExpandable
        className="w-full"
        label={
          <div className="flex flex-row gap-2 w-full justify-start">
            <GenreIcon className="w-5 h-5" /> Thể loại
          </div>
        }
        onClick={() => router.push("/genre")}
      >
        <div className="flex flex-col gap-2 w-full">
          {genres &&
            genres.length > 0 &&
            genres.map((genre, i) => (
              <Link
                key={genre}
                href={`/genre/${genre}`}
                className={`w-full text-start p-2 px-5 ${i !== genres.length - 1 ? "border-b" : ""} hover:bg-foreground/30 cursor-pointer`}
              >
                {snakeCaseToCapitalizeWord(genre)}
              </Link>
            ))}
        </div>
      </ButtonExpandable>
    );
  } else {
    return (
      <ButtonDropdown className="w-full h-full" label="Thể loại" onClick={() => router.push("/genre")}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1 w-[300px] sm:w-[400px] lg:grid-cols-3 lg:w-[600px]">
          {genres &&
            genres.length > 0 &&
            genres.map((genre, i) => (
              <Link key={genre} href={`/genre/${genre}`} className="w-full text-start p-2 border-b hover:bg-foreground/20 rounded-t-sm cursor-pointer">
                {snakeCaseToCapitalizeWord(genre)}
              </Link>
            ))}
        </div>
      </ButtonDropdown>
    );
  }
}

function NavBar({ duration = 100, autoHide = true, className }: NavBarProps) {
  const pathName = usePathname();

  const auth = useAuth();

  const user = auth?.user;

  const [hidden, setHidden] = useState(false);

  const [openSidebar, setOpenSidebar] = useState(false);
  const lastScrollY = useRef(0);

  function toggleSidebar() {
    setOpenSidebar(!openSidebar);
  }

  useEffect(() => {
    if (!autoHide) return;

    const handleNavbarHidden = () => {
      if (openSidebar) return;

      if (window.scrollY < 100) {
        setHidden(false);
        return;
      }

      if (window.scrollY - lastScrollY.current > 20 || window.scrollY - lastScrollY.current < -30) {
        setHidden(window.scrollY > lastScrollY.current);
      }

      lastScrollY.current = window.scrollY;
    };

    window.addEventListener("scroll", handleNavbarHidden);
    document.body.style.overflow = openSidebar ? "hidden" : "";

    return () => {
      window.removeEventListener("scroll", handleNavbarHidden);
      document.body.style.overflow = "";
    };
  }, [openSidebar, autoHide]);

  useEffect(() => {
    setOpenSidebar(false);
  }, [pathName]);

  return (
    <>
      <div
        className={`flex flex-row justify-between text-center text-foreground 
          items-center px-2.5 py-1 h-fit bg-background-items z-20 transition-transform duration-300
          rounded-b-md border-b-2 border-x border-foreground/40
          ${openSidebar ? "shadow-[5px_8px_4px_rgba(0,0,0,0.3)]" : "drop-shadow-[5px_8px_4px_rgba(0,0,0,0.3)]"}
          ${hidden ? "-translate-y-full" : ""} 
          ${className}
       `}
      >
        <div className={`flex flex-row justify-center items-center gap-5 h-10`}>
          <Link href={"/"}>
            <p className={`text-2xl font-holtwood`}>Mangament</p>
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex flex-row justify-center items-center gap-5 h-full min-w-[280px]">
            <RandomStoryButton />
            <RankingButton />
            <GenreButton />
          </div>
        </div>

        {/* Desktop */}
        <div className=" hidden lg:flex justify-center items-center gap-2.5">
          {!openSidebar && <SwitchTheme />}

          {/* Search */}
          <SearchStories className="w-[320px]" />

          <ButtonDropdown
            openOnLeft={false}
            icon={
              <div className="flex gap-1.5 min-w-10 aspect-square rounded-full overflow-hidden shrink-0">
                <Image
                  src={user?.avatar?.key ? [process.env.NEXT_PUBLIC_CDN_URL, user?.avatar?.key].join("/") : "/avatar.png"}
                  className="rounded-full shrink-0 "
                  alt="Avatar"
                  width={40}
                  height={40}
                />
              </div>
            }
          >
            {user ? (
              <>
                <ProfileButton />
                {user.role === "admin" && <WebManagementButton />}
                <FavouriteStoryButton />
                <HistoryButton />
                <ChangePasswordButton />
                <LogoutButton />
              </>
            ) : (
              <>
                <LoginButton />
                <RegisterButton />
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
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={`flex fixed top-0 left-0 h-screen w-screen z-40`}
            >
              {/* The blur black will cover all screen */}
              <button onClick={toggleSidebar} className="fixed top-0 left-0 h-screen w-screen bg-[#0000007a] "></button>

              {/* The side bar */}
              <div
                className="flex fixed top-5 bottom-5 right-0 flex-col gap-2.5 min-w-3/5 w-full max-w-[500px] bg-background-items
                px-2.5 py-4 rounded-l-lg shadow-[10px_13px_5px_rgba(0,0,0,0.3) overflow-y-scroll
                border-foreground/40 border-l-2 border-t-2 border-b-2 "
              >
                <div className="flex flex-row justify-between ">
                  <SwitchTheme />
                  <button className=" cursor-pointer" onClick={toggleSidebar}>
                    <XCloseIcon className="fill-foreground w-8 h-8" />
                  </button>
                </div>

                <SearchStories className="w-full" />

                {/* Content in navbar */}
                <div className="flex flex-col gap-2.5 ">
                  {user && <ProfileButton />}
                  {user && user.role === "admin" && <WebManagementButton />}
                  <RandomStoryButton isMobile />
                  <RankingButton isMobile />
                  <GenreButton isMobile />
                  {user ? (
                    <>
                      <FavouriteStoryButton />
                      <HistoryButton />
                      <ChangePasswordButton />
                      <LogoutButton />
                    </>
                  ) : (
                    <>
                      <LoginButton />
                      <RegisterButton />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 transition-all duration-300
            flex justify-center
            ${!hidden ? "scale-0" : ""}`}
        >
          <div className="h-16 w-28 absolute peer"></div>

          <div
            className="relative shadow-[5px_8px_4px_rgba(0,0,0,0.3)] cursor-pointer aspect-square w-11 h-11
                bg-background-items [clip-path:polygon(50%_50%,0_0,100%_0)] transition-all duration-300
                hover:scale-150 hover:translate-y-1/4
                peer-hover:scale-150 peer-hover:translate-y-1/4"
            onClick={() => setHidden(false)}
          >
            <div
              className="absolute shadow-[5px_8px_4px_rgba(0,0,0,0.3)] bg-background-items aspect-square w-10 
                [clip-path:polygon(50%_50%,0_0,100%_0)]  left-1/2 -translate-x-1/2 -translate-y-0.5"
            >
              <ArrowDownIcon className="w-4.5 h-4.5 m-auto"></ArrowDownIcon>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[60px]"></div>

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
