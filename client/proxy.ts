import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import useAuth from "./contexts/AuthContext";

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname, searchParams } = url;

  const auth = useAuth();

  if (pathname.startsWith("/home")) {
    url.pathname = `/`;
    url.search = searchParams.toString();

    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: ["/home"],
};
