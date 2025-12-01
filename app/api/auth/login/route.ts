import { apiPost } from "@/lib/server/apiWrapper";
import type { LoginRequest } from "@/types/auth";
import { NextResponse } from "next/server";

// Type definitions
interface LoginSuccessResponse {
  success: true;
  message: string;
}

interface LoginErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

interface BackendLoginResponse {
  success: boolean;
  message?: string;
  data?: {
    access_token: string;
    refresh_token: string;
  };
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
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
 * Set authentication cookies on the response
 */
const setAuthCookies = (
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void => {
  response.cookies.set(COOKIE_CONFIG.ACCESS_TOKEN.name, accessToken, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
  });

  response.cookies.set(COOKIE_CONFIG.REFRESH_TOKEN.name, refreshToken, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
  });
};

/**
 * Validate login request body
 */
const validateLoginRequest = (body: LoginRequest): string | null => {
  if (!body.email || typeof body.email !== "string") {
    return "Email is required";
  }

  if (!body.password || typeof body.password !== "string") {
    return "Password is required";
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return "Invalid email format";
  }

  return null;
};

/**
 * POST /api/auth/login
 * Authenticates user and sets authentication cookies
 */
export async function POST(req: Request): Promise<NextResponse<LoginResponse>> {
  try {
    // Parse and validate request body
    const body = (await req.json()) as LoginRequest;

    const validationError = validateLoginRequest(body);
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        { status: 400 }
      );
    }

    // Call backend login API
    const response = await apiPost("/auth/login", body);

    // Type guard to check if response has expected structure
    if (!response || typeof response !== "object" || !("json" in response)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from authentication service",
        },
        { status: 500 }
      );
    }

    const data = (await response.json()) as BackendLoginResponse;

    // Validate response data
    if (
      !data.success ||
      !data.data?.access_token ||
      !data.data?.refresh_token
    ) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Invalid login response from server",
        },
        { status: 500 }
      );
    }

    const { access_token, refresh_token } = data.data;

    // Create success response
    const successResponse = NextResponse.json(
      {
        success: true,
        message: data.message || "Login successful",
      },
      { status: 200 }
    );

    // Set authentication cookies
    setAuthCookies(successResponse, access_token, refresh_token);

    return successResponse;
  } catch (error) {
    // Log error for debugging
    console.error("Login error:", error);

    // Type-safe error handling
    const apiError = error as ApiErrorResponse;

    const errorMessage =
      apiError?.response?.data?.message ||
      apiError?.message ||
      "Login failed. Please try again.";

    const statusCode = apiError?.response?.status || 500;

    const errors = apiError?.response?.data?.errors;

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        errors,
      },
      { status: statusCode }
    );
  }
}