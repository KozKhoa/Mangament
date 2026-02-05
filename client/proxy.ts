import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname.startsWith("/stories")) {
    if (!url.searchParams.has("page") || !url.searchParams.has("sort")) {
      url.searchParams.set("page", "1");
      url.searchParams.set("sort", "updated_at:desc");

      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/ranking")) {
    if (!url.searchParams.has("rankBy")) {
      url.searchParams.set("rankBy", "hottest");

      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin/user-management")) {
    if (!url.searchParams.has("page")) {
      url.searchParams.set("page", "1");
      url.searchParams.set("sort", "join_date:desc");

      return NextResponse.redirect(url);
    }
  }
}

export const config = {
  matcher: ["/stories/:type", "/ranking/:storyType", "/admin/user-management"],
};
