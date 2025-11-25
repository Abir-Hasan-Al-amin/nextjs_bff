import type { AxiosRequestConfig } from "axios";
import type { NextRequest } from "next/server";

export function extractConfig(req: NextRequest): AxiosRequestConfig {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  const headers: Record<string, string> = {};
  const forwardedUser = req.headers.get("x-user");
  if (forwardedUser) headers["X-Forwarded-User"] = forwardedUser;

  const config: AxiosRequestConfig = {};
  if (Object.keys(params).length) config.params = params;
  if (Object.keys(headers).length) config.headers = headers;

  return config;
}
