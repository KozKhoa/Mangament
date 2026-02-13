"use client";

import Footer from "@/components/layouts/footer";
import NavBar from "@/components/layouts/navbar";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Link from "next/link";
import { usePathname } from "next/navigation";

// app/(user)/layout.tsx
export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathName = usePathname();

  const path = pathName.split("/");
  return (
    <div>
      <NavBar className="fixed left-2.5 right-2.5"></NavBar>

      <div className="max-w-[1700px] m-auto transition-all duration-300">
        {/* Thanh điều hướng */}
        <div
          className="flex flex-row flex-wrap m-2 gap-1 text-foreground/80 
          text-[1em] transition-all duration-300 rounded-md mx-2.5"
        >
          {path.map((p, i) => {
            if (p)
              return (
                <Link
                  key={i}
                  href={path.slice(0, i + 1).join("/")}
                  className={`w-fit cursor-pointer p-1 px-4 hover:bg-foreground/20 bg-foreground/10 
                  ${i === 1 ? "rounded-l-md" : ""}
                  ${i === path.length - 1 ? "rounded-r-md" : ""}`}
                >
                  {snakeCaseToCapitalizeWord(decodeURIComponent(p))}
                </Link>
              );
          })}
        </div>

        <div className="">{children}</div>
      </div>

      <Footer></Footer>
    </div>
  );
}
