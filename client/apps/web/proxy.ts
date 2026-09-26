import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname, searchParams } = url;

  if (pathname.startsWith("/home")) {
    url.pathname = `/`;
    url.search = searchParams.toString();

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home"],
};
