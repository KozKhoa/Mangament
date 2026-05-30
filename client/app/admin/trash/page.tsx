"use client";

import ArrowIcon from "@/public/arrows/right-v.svg";

import withAdmin from "@/hoc/withAdmin";
import Link from "@/components/link/Link";
import { useEffect } from "react";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

function Navigate({ children }: { children?: any }) {
  return (
    <div
      className="w-full px-5 py-3 flex justify-between items-center  bg-background-items rounded-lg shadow-[0px_4px_10px_rgb(0,0,0,0.2)]
            cursor-pointer hover:shadow-[0px_10px_10px_rgb(0,0,0,0.2)] hover:-translate-y-1 duration-100"
    >
      <div className="text-lg">{children}</div>
      <ArrowIcon className="w-4 h-4 text-foreground" />
    </div>
  );
}

export function TrashPage() {
  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <div className="flex flex-col gap-5 py-5">
      <Link href={"/admin/trash/images"}>
        <Navigate>Ảnh</Navigate>
      </Link>

      <Link href={"/admin/trash/stories"}>
        <Navigate>Story</Navigate>
      </Link>
    </div>
  );
}

export default withAdmin(TrashPage);
