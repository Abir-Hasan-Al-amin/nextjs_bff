import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Public routes that do NOT need login
  const publicPaths = ["/login", "/register"];

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const access = request.cookies.get("access_token")?.value;
  const refresh = request.cookies.get("refresh_token")?.value;

  if (!access && !refresh) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4) Token exists → allow
  return NextResponse.next();
}
export const config = {
  matcher: [
    /*
      Protect ALL routes except:
      - /api
      - /_next
      - /static
      - /favicon.ico
    */
    "/((?!api|_next|static|favicon.ico).*)",
  ],
};
