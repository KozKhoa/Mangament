import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname, searchParams } = url;
}

export const config = {
  matcher: [],
};
