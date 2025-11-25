import { clearAuthCookies } from "@/lib/server/cookies";
import { NextResponse } from "next/server";

export async function logout() {
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
