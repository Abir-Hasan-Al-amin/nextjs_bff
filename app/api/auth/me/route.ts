import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Failed to logout" }, { status: 401 });
}
