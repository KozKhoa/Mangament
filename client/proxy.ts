import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  if (!url.searchParams.has("page")) {
    url.searchParams.set("page", "1");
    url.searchParams.set("sort", "updated_at:desc");

    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/stories/:type"],
};
