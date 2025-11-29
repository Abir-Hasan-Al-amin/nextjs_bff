import { apiPost } from "@/lib/server/apiWrapper";
import type { LoginRequest } from "@/types/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginRequest;
    const response = await apiPost("/auth/login", body);
    const data = await response.json();
    const { access_token, refresh_token } = data.data;
    const { message } = data;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { message: "Invalid login response" },
        { status: 500 }
      );
    }

    const res = NextResponse.json(
      { message: message ?? "Login successful" },
      { status: 200 }
    );

    res.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 1,
    });
    res.cookies.set("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    const err = error as {
      response: {
        data: {
          message: string;
        };
        status: number;
      };
    };
    return NextResponse.json(
      {
        message: err?.response?.data?.message || "Login failed",
      },
      { status: err?.response?.status || 500 }
    );
  }
}
