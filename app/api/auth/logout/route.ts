import { clearAuthCookies } from "@/lib/server/cookies";
import { AxiosError } from "axios";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await clearAuthCookies();

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as AxiosError;
    return NextResponse.json(
      { error: err.message || "Failed to logout" },
      { status: err.response?.status || 500 }
    );
  }
}
