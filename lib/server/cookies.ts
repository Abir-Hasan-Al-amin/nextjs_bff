import { cookies } from "next/headers";

export async function setAuthCookies({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: "accessToken",
    value: accessToken,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 60 * 15,
  });

  cookieStore.set({
    name: "refreshToken",
    value: refreshToken,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: "accessToken",
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 0,
  });

  cookieStore.set({
    name: "refreshToken",
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 0,
  });
}
