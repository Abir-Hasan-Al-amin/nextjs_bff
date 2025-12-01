import { apiPost } from "@/lib/server/apiWrapper";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Type definitions
interface RefreshTokenResponse {
  success: boolean;
  message?: string;
  data?: {
    access_token: string;
    refresh_token?: string;
  };
}

interface ErrorResponse {
  message: string;
}

// Cookie configuration constants
const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: "access_token",
    maxAge: 60 * 15, // 15 minutes
  },
  REFRESH_TOKEN: {
    name: "refresh_token",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
} as const;

const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/**
 * Clears authentication cookies
 */
const clearAuthCookies = (response: NextResponse): void => {
  response.cookies.set(COOKIE_CONFIG.ACCESS_TOKEN.name, "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(COOKIE_CONFIG.REFRESH_TOKEN.name, "", {
    path: "/",
    maxAge: 0,
  });
};

/**
 * Sets authentication cookies
 */
const setAuthCookies = (
  response: NextResponse,
  accessToken: string,
  refreshToken?: string
): void => {
  // Set access token
  response.cookies.set(COOKIE_CONFIG.ACCESS_TOKEN.name, accessToken, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
  });

  // Set refresh token if provided (optional - backend might not return new one)
  if (refreshToken) {
    response.cookies.set(COOKIE_CONFIG.REFRESH_TOKEN.name, refreshToken, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
    });
  }
};

/**
 * Creates an error response with cleared cookies
 */
const createErrorResponse = (
  message: string,
  status: number
): NextResponse<ErrorResponse> => {
  const response = NextResponse.json({ message }, { status });
  clearAuthCookies(response);
  return response;
};

/**
 * POST /api/auth/refresh-token
 * Refreshes the access token using the refresh token
 */
export async function POST(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
    const refreshToken = cookieStore.get(
      COOKIE_CONFIG.REFRESH_TOKEN.name
    )?.value;

    // If access token is still valid, no need to refresh
    if (accessToken) {
      return NextResponse.json(
        { message: "Access token already valid" },
        { status: 200 }
      );
    }

    // No refresh token available
    if (!refreshToken) {
      return createErrorResponse("No refresh token available", 401);
    }

    // Call backend API to refresh token
    const response = await apiPost("/auth/refresh-token", { refreshToken });

    // Type guard to check if response has data property
    if (!response || typeof response !== "object" || !("data" in response)) {
      return createErrorResponse(
        "Invalid response from authentication service",
        500
      );
    }

    const data = response.data as RefreshTokenResponse;

    // Validate response structure
    if (!data?.success || !data?.data?.access_token) {
      return createErrorResponse(
        data?.message || "Failed to refresh token",
        401
      );
    }

    const { access_token, refresh_token: new_refresh_token } = data.data;

    // Create success response
    const successResponse = NextResponse.json(
      { message: "Access token refreshed successfully" },
      { status: 200 }
    );

    // Set new tokens
    setAuthCookies(successResponse, access_token, new_refresh_token);

    return successResponse;
  } catch (error) {
    // Log error for debugging (consider using a proper logging service)
    console.error("Token refresh error:", error);

    // Determine appropriate error message
    let errorMessage = "Failed to refresh token";
    let statusCode = 500;

    // Handle specific error types if needed
    if (error instanceof Error) {
      // You can add more specific error handling here
      if (error.message.includes("Network")) {
        errorMessage = "Unable to reach authentication service";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Token refresh timed out";
        statusCode = 504;
      }
    }

    return createErrorResponse(errorMessage, statusCode);
  }
}