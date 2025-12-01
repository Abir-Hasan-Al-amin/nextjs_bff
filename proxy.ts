import { NextRequest, NextResponse } from "next/server";

// Configuration constants
const AUTH_COOKIES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

const PUBLIC_PATHS = [
  "/login"
] as const;

const PROTECTED_PATHS = ["/"] as const;

/**
 * Check if the path is public (doesn't require authentication)
 */
const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
};

/**
 * Check if the path requires authentication
 */
const isProtectedPath = (pathname: string): boolean => {
  // If you have specific protected paths, check them
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return true;
  }

  // By default, all non-public paths are protected
  return !isPublicPath(pathname);
};

/**
 * Check if user has valid authentication tokens
 */
const hasValidTokens = (request: NextRequest): boolean => {
  const accessToken = request.cookies.get(AUTH_COOKIES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIES.REFRESH_TOKEN)?.value;

  // User is authenticated if they have either token
  return Boolean(accessToken || refreshToken);
};

/**
 * Redirect to login page
 */
const redirectToLogin = (request: NextRequest): NextResponse => {
  const loginUrl = new URL("/login", request.url);

  // Save the original destination to redirect back after login
  const callbackUrl = request.nextUrl.pathname + request.nextUrl.search;
  if (callbackUrl !== "/") {
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
  }

  return NextResponse.redirect(loginUrl);
};

/**
 * Redirect authenticated users away from auth pages
 */
const redirectToDashboard = (request: NextRequest): NextResponse => {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  const dashboardUrl = new URL(callbackUrl || "/dashboard", request.url);

  return NextResponse.redirect(dashboardUrl);
};

/**
 * Main proxy function
 */
export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);
  const hasAuth = hasValidTokens(request);

  // Allow public paths for non-authenticated users
  if (isPublic && !hasAuth) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from login/register pages
  if (isPublic && hasAuth) {
    return redirectToDashboard(request);
  }

  // Redirect non-authenticated users to login
  if (!isPublic && !hasAuth) {
    return redirectToLogin(request);
  }

  // Allow authenticated users to access protected routes
  return NextResponse.next();
}

/**
 * proxy configuration
 * Protects all routes except API, static files, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api (API routes)
     * - /_next (Next.js internals)
     * - /static (static files)
     * - /*.* (files with extensions like .ico, .png, .jpg)
     */
    "/((?!api|_next|static|.*\\..*).*)",
  ],
};
