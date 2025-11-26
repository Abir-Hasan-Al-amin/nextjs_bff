import { apiPost } from "@/lib/server/apiWrapper";
import type { LoginRequest } from "@/types/auth";

export async function POST(req: Request) {
  const body = (await req.json()) as LoginRequest;
  return apiPost("/auth/login", body);
}
