// import axios from "axios";

// const instance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   withCredentials: true,
//   timeout: 60000,
// });

// instance.interceptors.response.use(
//   (res) => res.data,
//   async (error) => {
//     const originalRequest = error.config;

//     if (!error.response) {
//       return Promise.reject({ statusCode: 0, message: "Network error" });
//     }

//     const status = error.response.status;
//     const message = error.response.data?.message || "";
//     if (status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         await instance.post("/auth/refresh-token");
//         return instance(originalRequest);
//       } catch (e) {
//         window.location.href = "/login";
//         return Promise.reject({
//           statusCode: 401,
//           message: "Session expired",
//         });
//       }
//     }

//     if (status === 403) {
//       return Promise.reject({ statusCode: 403, message: "Forbidden" });
//     }
//     return Promise.reject({
//       statusCode: status,
//       message,
//       errors: error.response.data?.errors,
//     });
//   }
// );

// export { instance as axiosInstance };

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// Type definitions
interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

interface ErrorResponseData {
  message?: string;
  errors?: Record<string, string[]>;
}

// Configuration
interface AxiosConfig {
  baseURL?: string;
  timeout?: number;
  loginPath?: string;
  onRefreshFailed?: () => void;
}

// Token refresh state management
let isRefreshing = false;
let refreshSubscribers: Array<(error?: ApiError) => void> = [];

const subscribeTokenRefresh = (callback: (error?: ApiError) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (error?: ApiError) => {
  refreshSubscribers.forEach((callback) => callback(error));
  refreshSubscribers = [];
};

/**
 * Creates a configured Axios instance with automatic token refresh
 * and comprehensive error handling
 */
const createAxiosInstance = (config: AxiosConfig = {}): AxiosInstance => {
  const {
    baseURL = process.env.NEXT_PUBLIC_API_URL,
    timeout = 60000,
    loginPath = "/login",
    onRefreshFailed,
  } = config;

  const instance = axios.create({
    baseURL,
    withCredentials: true,
    timeout,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor (optional - for adding auth headers if needed)
  instance.interceptors.request.use(
    (config) => {
      // Add any custom headers here if needed
      // For example: config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      // Return the data directly for successful responses
      return response.data;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle network errors
      if (!error.response) {
        const networkError: ApiError = {
          statusCode: 0,
          message: getNetworkErrorMessage(error),
        };
        return Promise.reject(networkError);
      }

      const status = error.response.status;
      const responseData = error.response.data as ErrorResponseData;
      const message = responseData?.message || getDefaultErrorMessage(status);

      // Handle 401 Unauthorized - Token refresh logic
      if (status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((error?: ApiError) => {
              if (error) {
                reject(error);
              } else {
                resolve(instance(originalRequest));
              }
            });
          });
        }

        isRefreshing = true;

        try {
          // Attempt to refresh the token
          await instance.post("/auth/refresh-token");

          isRefreshing = false;
          onRefreshed(); // Resolve all queued requests

          // Retry the original request
          return instance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;

          // Create error object for queued requests
          const authError: ApiError = {
            statusCode: 401,
            message: "Session expired. Please login again.",
          };

          onRefreshed(authError); // Reject all queued requests

          // Handle redirect to login
          handleAuthFailure(loginPath, onRefreshFailed);

          return Promise.reject(authError);
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        const forbiddenError: ApiError = {
          statusCode: 403,
          message:
            message || "You don't have permission to access this resource.",
        };
        return Promise.reject(forbiddenError);
      }

      // Handle 404 Not Found
      if (status === 404) {
        const notFoundError: ApiError = {
          statusCode: 404,
          message: message || "The requested resource was not found.",
        };
        return Promise.reject(notFoundError);
      }

      // Handle 500 Server Error
      if (status >= 500) {
        const serverError: ApiError = {
          statusCode: status,
          message:
            message ||
            "An unexpected server error occurred. Please try again later.",
        };
        return Promise.reject(serverError);
      }

      // Handle all other errors
      const apiError: ApiError = {
        statusCode: status,
        message,
        errors: responseData?.errors,
      };

      return Promise.reject(apiError);
    }
  );

  return instance;
};

/**
 * Get appropriate network error message based on error code
 */
const getNetworkErrorMessage = (error: AxiosError): string => {
  if (error.code === "ECONNABORTED") {
    return "Request timeout. Please try again.";
  }
  if (error.code === "ERR_NETWORK") {
    return "Network error. Please check your internet connection.";
  }
  if (error.code === "ERR_CANCELED") {
    return "Request was cancelled.";
  }
  return "Unable to connect to the server. Please try again.";
};

/**
 * Get default error message for HTTP status codes
 */
const getDefaultErrorMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: "Bad request. Please check your input.",
    401: "Authentication required.",
    403: "Access denied.",
    404: "Resource not found.",
    409: "Conflict. The resource already exists.",
    422: "Validation error. Please check your input.",
    429: "Too many requests. Please try again later.",
    500: "Internal server error.",
    502: "Bad gateway.",
    503: "Service unavailable.",
    504: "Gateway timeout.",
  };

  return messages[status] || "An error occurred. Please try again.";
};

/**
 * Handle authentication failure - redirect to login
 */
const handleAuthFailure = (
  loginPath: string,
  onRefreshFailed?: () => void
): void => {
  // Call custom callback if provided
  if (onRefreshFailed) {
    onRefreshFailed();
    return;
  }

  // Only redirect on client side
  if (typeof window !== "undefined") {
    // Clear any stored auth data if needed
    // localStorage.removeItem("token");

    // Redirect to login page
    window.location.href = loginPath;
  }
};

// Create and export the default instance
export const axiosInstance = createAxiosInstance();

// Export the factory function for custom instances
export { createAxiosInstance };

// Export types
export type { ApiError, ApiResponse, AxiosConfig };
