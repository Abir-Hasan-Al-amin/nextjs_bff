import { clearAuthCookies } from "@/lib/server/cookies";
import { NextResponse } from "next/server";

// Type definitions
interface LogoutSuccessResponse {
  success: true;
  message: string;
}

interface LogoutErrorResponse {
  success: false;
  message: string;
}

type LogoutResponse = LogoutSuccessResponse | LogoutErrorResponse;

/**
 * POST /api/auth/logout
 * Logs out the user by clearing authentication cookies
 */
export async function POST(): Promise<NextResponse<LogoutResponse>> {
  try {
    // Clear authentication cookies
    await clearAuthCookies();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging
    console.error("Logout error:", error);

    // Determine error message
    let errorMessage = "Failed to logout";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific error types
      if (error.name === "CookieError") {
        errorMessage = "Failed to clear authentication cookies";
        statusCode = 500;
      }
    }

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: statusCode }
    );
  }
}
