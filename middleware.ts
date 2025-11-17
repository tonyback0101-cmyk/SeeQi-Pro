import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REF_COOKIE = "seeqi_ref";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const ref = url.searchParams.get("ref") ?? url.searchParams.get("ref_code");

  if (!ref) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(REF_COOKIE, ref, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

export const config = {
  matcher: ["/(?!api|_next|.*\\..*).+"],
};
