import { extractConfig } from "@/lib/server/apiConfig";
import { apiGet } from "@/lib/server/apiWrapper";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return apiGet("/todos", extractConfig(req));
}
