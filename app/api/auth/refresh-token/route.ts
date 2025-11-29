import { apiPost } from "@/lib/server/apiWrapper";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (accessToken) {
      return NextResponse.json(
        { message: "Access token already valid" },
        { status: 200 }
      );
    }

    if (!refreshToken) {
      // No refresh token → treat as expired
      const res = NextResponse.json(
        { message: "No refresh token" },
        { status: 401 }
      );

      // Delete cookies anyway
      res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
      res.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });

      return res;
    }

    const response = await apiPost("/auth/refresh-token", { refreshToken });
    const data = response.data;

    if (!data.success || !data.data?.access_token) {
      const res = NextResponse.json(
        { message: data.message || "Failed to refresh token" },
        { status: 401 } // ← 401 here instead of 500
      );

      // Delete cookies
      res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
      res.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });

      return res;
    }

    const { access_token } = data.data;
    const res = NextResponse.json(
      { message: "Access token refreshed" },
      { status: 200 }
    );

    // Set new access token
    res.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });

    return res;
  } catch (err) {
    const res = NextResponse.json(
      { message: "Refresh token failed" },
      { status: 500 }
    );

    // Delete cookies to prevent stale tokens
    res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    res.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });

    return res;
  }
}
